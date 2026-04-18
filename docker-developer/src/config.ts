import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { Config } from './types.js';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export function loadConfig(): Config {
  const configPath = process.env.CONFIG_PATH || '/workspace/config.yaml';

  try {
    const content = readFileSync(configPath, 'utf-8');
    const config = parse(content) as Config;

    applyEnvOverrides(config);
    return config;
  } catch {
    logger.warn('Config file not found, using defaults');
    return getDefaultConfig();
  }
}

function applyEnvOverrides(config: Config): void {
  if (process.env.WS_ENDPOINT) {
    const url = new URL(process.env.WS_ENDPOINT);
    config.websocket.host = url.hostname;
    config.websocket.port = parseInt(url.port) || 8765;
    config.websocket.path = url.pathname;
  }

  if (process.env.WORKSPACE) {
    config.developer.workspace = process.env.WORKSPACE;
  }

  if (process.env.GIT_USER_NAME) {
    config.git.userName = process.env.GIT_USER_NAME;
  }

  if (process.env.GIT_USER_EMAIL) {
    config.git.userEmail = process.env.GIT_USER_EMAIL;
  }

  if (process.env.CONTAINER_ID) {
    config.developer.containerId = process.env.CONTAINER_ID;
  }

  if (process.env.RUNNER_WS_URL) {
    const url = new URL(process.env.RUNNER_WS_URL);
    config.websocket.host = url.hostname;
    config.websocket.port = parseInt(url.port) || 8765;
    config.websocket.path = url.pathname;
  }
}

function getDefaultConfig(): Config {
  return {
    websocket: {
      host: process.env.WS_HOST || 'host.docker.internal',
      port: parseInt(process.env.WS_PORT || '8765'),
      path: '/developer',
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
    },
    ssh: {
      gitKeyPath: '/home/developer/.ssh/id_rsa',
      hostKeyPath: '/home/developer/.ssh/host_key',
      knownHostsPath: '/home/developer/.ssh/known_hosts',
    },
    git: {
      remote: 'origin',
      autoPush: false,
      commitPrefix: '[docker-developer]',
      userName: 'Developer Bot',
      userEmail: 'developer@example.com',
    },
    terminal: {
      port: 3000,
      shell: '/bin/bash',
      maxSessions: 5,
    },
    openSpec: {
      templatePath: '/workspace/templates',
      autoInitialize: true,
    },
    task: {
      defaultTimeout: 3600,
      maxRetries: 3,
    },
    developer: {
      workspace: process.env.WORKSPACE || '/workspace',
      logLevel: process.env.LOG_LEVEL || 'info',
      containerId: process.env.CONTAINER_ID || `docker-dev-${crypto.randomUUID()}`,
    },
  };
}
