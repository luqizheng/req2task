import pino from 'pino';
import { Config, TaskPayload, ResultPayload } from './types.js';
import { GitManager } from './git.js';
import { EnvManager } from './env.js';

const logger = pino({ name: 'task-processor' });

interface TaskState {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  startTime: number;
  timeout: number;
  retries: number;
}

export class TaskProcessor {
  private config: Config;
  private gitManager: GitManager;
  private envManager: EnvManager;
  private currentTask: TaskState | null = null;
  private timeoutTimer: NodeJS.Timeout | null = null;
  private onComplete: ((result: ResultPayload) => void) | null = null;
  private onAssistRequest: ((reason: string, message: string) => void) | null = null;

  constructor(config: Config, gitManager: GitManager, envManager: EnvManager) {
    this.config = config;
    this.gitManager = gitManager;
    this.envManager = envManager;
  }

  async processTask(
    task: TaskPayload,
    onComplete: (result: ResultPayload) => void,
    onAssistRequest: (reason: string, message: string) => void,
  ): Promise<void> {
    this.onComplete = onComplete;
    this.onAssistRequest = onAssistRequest;

    const timeout = task.timeout || this.config.task.defaultTimeout;

    this.currentTask = {
      taskId: task.taskId,
      status: 'running',
      startTime: Date.now(),
      timeout,
      retries: 0,
    };

    this.startTimeoutTimer(timeout);

    try {
      logger.info({ taskId: task.taskId, type: task.taskType }, 'Processing task');

      const branchName = await this.gitManager.createBranch(task.taskType, task.taskId);

      logger.info({ branchName }, 'Branch created for task');

      await this.executeTask(task);

      if (this.currentTask?.status === 'running') {
        this.currentTask.status = 'completed';
        const { modified, untracked } = await this.gitManager.getStatus();

        const commitMessage = `${this.config.git.commitPrefix} ${task.taskType}: ${task.title}`;
        const commitHash = await this.gitManager.commit(commitMessage);

        if (this.config.git.autoPush) {
          await this.gitManager.push();
        }

        const result: ResultPayload = {
          taskId: task.taskId,
          status: 'success',
          branchName,
          commitHash,
          filesChanged: [...modified, ...untracked],
          message: 'Task completed successfully',
        };

        this.onComplete?.(result);
      }
    } catch (error) {
      logger.error({ error }, 'Task execution failed');

      if (this.currentTask) {
        this.currentTask.retries++;

        if (this.currentTask.retries >= this.config.task.maxRetries) {
          this.currentTask.status = 'failed';
          this.requestAssist('error', `Task failed after ${this.currentTask.retries} retries: ${error}`);
        }
      }
    } finally {
      this.clearTimeoutTimer();
    }
  }

  private async executeTask(task: TaskPayload): Promise<void> {
    const workspace = this.config.developer.workspace;
    const specFile = `${workspace}/spec.md`;

    logger.info({ workspace, taskId: task.taskId }, 'Executing task');

    await this.simulateTaskExecution(task);
  }

  private async simulateTaskExecution(task: TaskPayload): Promise<void> {
    logger.info({ description: task.description }, 'Simulating task execution');

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private startTimeoutTimer(timeout: number): void {
    this.clearTimeoutTimer();

    this.timeoutTimer = setTimeout(() => {
      if (this.currentTask?.status === 'running') {
        this.currentTask.status = 'timeout';
        this.requestAssist(
          'timeout',
          `Task ${this.currentTask.taskId} timed out after ${timeout} seconds`
        );
      }
    }, timeout * 1000);
  }

  private clearTimeoutTimer(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  private requestAssist(reason: string, message: string): void {
    this.onAssistRequest?.(reason, message);

    if (this.currentTask) {
      const result: ResultPayload = {
        taskId: this.currentTask.taskId,
        status: 'needs_assist',
        branchName: '',
        message: `Task requires assistance: ${message}`,
      };

      this.onComplete?.(result);
    }
  }

  cancelCurrentTask(): void {
    if (this.currentTask) {
      this.currentTask.status = 'failed';
      this.clearTimeoutTimer();
      logger.info({ taskId: this.currentTask.taskId }, 'Task cancelled');
    }
  }

  getCurrentTask(): TaskState | null {
    return this.currentTask;
  }
}
