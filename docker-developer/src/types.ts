export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}

export interface ContainerPayload {
  action: 'assign' | 'ready' | 'heartbeat' | 'release';
  containerId?: string;
  ports?: ExposedPort[];
  endpoint?: string;
  status?: 'starting' | 'ready' | 'error';
  error?: string;
}

export interface ExposedPort {
  internal: number;
  external: number;
  protocol: 'tcp' | 'udp';
  name?: string;
}

export interface EnvPayload {
  action: 'init' | 'update' | 'sync';
  config: EnvConfig;
}

export interface EnvConfig {
  database?: DatabaseConfig;
  redis?: RedisConfig;
  services?: Record<string, ServiceConfig>;
  envVars?: Record<string, string>;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  type: 'postgresql' | 'mysql' | 'mongodb';
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface ServiceConfig {
  url: string;
  auth?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface McpPayload {
  action: 'register' | 'update' | 'unregister';
  servers: McpServer[];
}

export interface McpServer {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface AssistPayload {
  action: 'request' | 'resolve' | 'escalate';
  reason: 'timeout' | 'error' | 'blocked' | 'completed';
  taskId?: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface TaskPayload {
  taskId: string;
  taskType: 'bug' | 'feature' | 'hotfix';
  title: string;
  description: string;
  targetBranch?: string;
  priority?: 'low' | 'medium' | 'high';
  timeout?: number;
}

export interface ResultPayload {
  taskId: string;
  status: 'success' | 'failed' | 'timeout' | 'needs_assist';
  branchName: string;
  commitHash?: string;
  filesChanged?: string[];
  message?: string;
}

export interface NotificationPayload {
  event: string;
  taskId?: string;
  containerId?: string;
  details: Record<string, unknown>;
}

export interface TerminalPayload {
  action: 'connect' | 'input' | 'resize' | 'disconnect';
  sessionId?: string;
  data?: string;
  cols?: number;
  rows?: number;
}

export interface CredentialPayload {
  type: 'git_ssh_key' | 'host_access_key' | 'known_hosts';
  content: string;
  filename: string;
}

export interface Config {
  websocket: {
    host: string;
    port: number;
    path: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    heartbeatInterval: number;
  };
  ssh: {
    gitKeyPath: string;
    hostKeyPath: string;
    knownHostsPath: string;
  };
  git: {
    remote: string;
    autoPush: boolean;
    commitPrefix: string;
    userName: string;
    userEmail: string;
  };
  terminal: {
    port: number;
    shell: string;
    maxSessions: number;
  };
  openSpec: {
    templatePath: string;
    autoInitialize: boolean;
  };
  task: {
    defaultTimeout: number;
    maxRetries: number;
  };
  developer: {
    workspace: string;
    logLevel: string;
    containerId: string;
  };
}
