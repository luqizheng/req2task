import pino from 'pino';
import { loadConfig } from './config.js';
import { WsClient } from './websocket.js';
import { SshKeyManager } from './ssh.js';
import { GitManager } from './git.js';
import { EnvManager } from './env.js';
import { TaskProcessor } from './task.js';
import {
  Config,
  WebSocketMessage,
  TaskPayload,
  ResultPayload,
  CredentialPayload,
  EnvPayload,
  AssistPayload,
} from './types.js';

const logger = pino({ name: 'main' });

class DockerDeveloper {
  private config: Config;
  private wsClient: WsClient;
  private sshManager: SshKeyManager;
  private gitManager: GitManager;
  private envManager: EnvManager;
  private taskProcessor: TaskProcessor;

  constructor() {
    this.config = loadConfig();
    this.wsClient = new WsClient(this.config);
    this.sshManager = new SshKeyManager(this.config);
    this.gitManager = new GitManager(this.config);
    this.envManager = new EnvManager(this.config);
    this.taskProcessor = new TaskProcessor(this.config, this.gitManager, this.envManager);

    this.setupMessageHandlers();
  }

  private setupMessageHandlers(): void {
    this.wsClient.on('task', async (payload) => {
      await this.handleTask(payload as TaskPayload);
    });

    this.wsClient.on('credential', async (payload) => {
      await this.handleCredential(payload as CredentialPayload);
    });

    this.wsClient.on('env', async (payload) => {
      await this.handleEnv(payload as EnvPayload);
    });

    this.wsClient.on('assist', async (payload) => {
      await this.handleAssist(payload as AssistPayload);
    });

    this.wsClient.on('container', async (payload) => {
      await this.handleContainer(payload);
    });
  }

  async start(): Promise<void> {
    logger.info({ containerId: this.config.developer.containerId }, 'Starting Docker Developer');

    try {
      await this.wsClient.connect();

      await this.register();

      this.wsClient.on('close', () => {
        logger.warn('WebSocket closed, will attempt to reconnect');
      });

      this.wsClient.on('error', (error) => {
        logger.error({ error }, 'WebSocket error');
      });

    } catch (error) {
      logger.error({ error }, 'Failed to start');
      process.exit(1);
    }
  }

  private async register(): Promise<void> {
    logger.info('Registering with host');

    this.wsClient.send('register', {
      type: 'developer',
      container_id: this.config.developer.containerId,
      bot_type: 'docker-developer',
      version: '1.0.0',
      capabilities: [
        'git',
        'websocket-terminal',
        'open-spec',
        'nodejs-development',
        'typescript-development',
      ],
    });
  }

  private async handleTask(payload: TaskPayload): Promise<void> {
    logger.info({ taskId: payload.taskId }, 'Received task');

    await this.taskProcessor.processTask(
      payload,
      (result) => this.sendResult(result),
      (reason, message) => this.requestAssist(reason, message),
    );
  }

  private async handleCredential(payload: CredentialPayload): Promise<void> {
    logger.info({ type: payload.type }, 'Received credential');

    const success = await this.sshManager.installCredential(payload);

    if (success) {
      this.wsClient.send('notification', {
        event: 'credential_installed',
        containerId: this.config.developer.containerId,
        details: { type: payload.type },
      });
    }
  }

  private async handleEnv(payload: EnvPayload): Promise<void> {
    logger.info({ action: payload.action }, 'Received environment config');

    if (payload.action === 'init' || payload.action === 'update') {
      await this.envManager.saveConfig(payload.config);

      this.wsClient.send('notification', {
        event: 'env_received',
        containerId: this.config.developer.containerId,
        details: { action: payload.action },
      });
    }
  }

  private async handleAssist(payload: AssistPayload): Promise<void> {
    logger.info({ action: payload.action, reason: payload.reason }, 'Received assist message');

    if (payload.action === 'resolve' && payload.taskId) {
      logger.info({ taskId: payload.taskId }, 'Assist resolved, continuing task');
    }
  }

  private async handleContainer(payload: unknown): Promise<void> {
    const p = payload as { action: string; status?: string };

    if (p.action === 'release') {
      logger.info('Container release requested, shutting down');
      this.wsClient.close();
      process.exit(0);
    }
  }

  private sendResult(result: ResultPayload): void {
    logger.info({ taskId: result.taskId, status: result.status }, 'Sending task result');

    this.wsClient.send('result', result);
  }

  private requestAssist(reason: string, message: string): void {
    logger.info({ reason, message }, 'Requesting human assistance');

    const task = this.taskProcessor.getCurrentTask();

    this.wsClient.send('assist', {
      action: 'request',
      reason,
      message,
      taskId: task?.taskId,
      containerId: this.config.developer.containerId,
      context: {
        taskStatus: task?.status,
        retries: task?.retries,
      },
    });
  }
}

const developer = new DockerDeveloper();
developer.start().catch((error) => {
  logger.error({ error }, 'Fatal error');
  process.exit(1);
});
