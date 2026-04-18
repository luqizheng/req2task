# Docker Developer 规范

## 概述

Docker Developer 是一个运行在容器中的开发助手机器人，通过 WebSocket 与主机通信，接收任务指令并自动执行开发工作。

## 核心职责

1. **任务获取与执行** - 通过 WebSocket 接收任务，解析需求并执行编程工作
2. **分支管理** - 根据任务类型自动创建 `bug/`、`feature/`、`hotfix/` 分支
3. **Git 操作** - 自动 commit 代码变更并通知任务完成
4. **开发环境初始化** - 使用 open-spec 框架进行需求开发
5. **密钥管理** - 安全接收和使用 Git SSH Key、主机访问凭证
6. **终端接入** - 支持主机通过 Web 终端远程操控容器
7. **环境配置接收** - 接收主机发送的开发环境配置（数据库、Redis、MCP 等）
8. **人工协助请求** - 任务完成/超时/错误时请求人工介入

## 基础镜像

```
zhcoder-docker-registry.com:8000/library/node:v22-slim
```

## 技术架构

### 通信协议

```typescript
interface WebSocketMessage {
  type: 'task' | 'result' | 'notification' | 'error' | 'terminal' | 'credential' | 'container' | 'env' | 'mcp' | 'assist';
  payload: TaskPayload | ResultPayload | NotificationPayload | ErrorPayload | TerminalPayload | CredentialPayload | ContainerPayload | EnvPayload | McpPayload | AssistPayload;
  timestamp: string;
}

interface ContainerPayload {
  action: 'assign' | 'ready' | 'heartbeat' | 'release';
  containerId?: string;
  ports?: ExposedPort[];
  endpoint?: string;
  status?: 'starting' | 'ready' | 'error';
  error?: string;
}

interface ExposedPort {
  internal: number;
  external: number;
  protocol: 'tcp' | 'udp';
  name?: string;
}

interface EnvPayload {
  action: 'init' | 'update' | 'sync';
  config: EnvConfig;
}

interface EnvConfig {
  database?: DatabaseConfig;
  redis?: RedisConfig;
  services?: Record<string, ServiceConfig>;
  envVars?: Record<string, string>;
}

interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  type: 'postgresql' | 'mysql' | 'mongodb';
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

interface ServiceConfig {
  url: string;
  auth?: Record<string, string>;
  headers?: Record<string, string>;
}

interface McpPayload {
  action: 'register' | 'update' | 'unregister';
  servers: McpServer[];
}

interface McpServer {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}

interface AssistPayload {
  action: 'request' | 'resolve' | 'escalate';
  reason: 'timeout' | 'error' | 'blocked' | 'completed';
  taskId?: string;
  message: string;
  context?: Record<string, unknown>;
}

interface TaskPayload {
  taskId: string;
  taskType: 'bug' | 'feature' | 'hotfix';
  title: string;
  description: string;
  targetBranch?: string;
  priority?: 'low' | 'medium' | 'high';
  timeout?: number;
}

interface ResultPayload {
  taskId: string;
  status: 'success' | 'failed' | 'timeout' | 'needs_assist';
  branchName: string;
  commitHash?: string;
  filesChanged?: string[];
  message?: string;
}

interface NotificationPayload {
  event: 'branch_created' | 'commit_completed' | 'task_completed' | 'task_started' | 'container_ready' | 'env_received' | 'mcp_ready' | 'assist_requested';
  taskId?: string;
  containerId?: string;
  details: Record<string, unknown>;
}

interface TerminalPayload {
  action: 'connect' | 'input' | 'resize' | 'disconnect';
  sessionId?: string;
  data?: string;
  cols?: number;
  rows?: number;
}

interface CredentialPayload {
  type: 'git_ssh_key' | 'host_access_key' | 'known_hosts';
  content: string;
  filename: string;
}
```

### 目录结构

```
docker-developer/
├── src/
│   ├── websocket/          # WebSocket 客户端
│   │   ├── client.ts
│   │   └── terminal.ts     # 终端会话管理
│   ├── git/                # Git 操作
│   │   └── manager.ts
│   ├── ssh/                # SSH 密钥管理
│   │   └── key-manager.ts
│   ├── task/               # 任务处理
│   │   └── processor.ts
│   ├── env/                # 环境配置管理
│   │   └── manager.ts
│   ├── mcp/                # MCP 服务器管理
│   │   ├── client.ts
│   │   └── server.ts
│   ├── assist/             # 人工协助
│   │   └── handler.ts
│   ├── open-spec/          # OpenSpec 集成
│   │   └── initializer.ts
│   ├── types/              # 类型定义
│   │   └── index.ts
│   └── index.ts            # 入口文件
├── nginx/
│   └── default.conf        # Nginx 配置
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 功能模块

### 1. 密钥管理

| 类型 | 用途 | 存储路径 |
|------|------|----------|
| Git SSH Key | 访问 Git 仓库 | `/home/developer/.ssh/id_rsa` |
| Host Access Key | SSH 跳板连接主机 | `/home/developer/.ssh/host_key` |
| Known Hosts | 主机指纹验证 | `/home/developer/.ssh/known_hosts` |

**密钥接收流程**：
1. 主机通过 WebSocket 发送 `credential` 消息
2. Docker Developer 验证格式后写入对应文件
3. 设置正确权限 `chmod 600`
4. 发送 `credential_installed` 通知

### 2. 环境配置管理

主机发送开发环境配置后，Docker Developer 保存并应用：

```typescript
interface EnvManager {
  saveConfig(config: EnvConfig): Promise<void>;
  getConfig(): EnvConfig | null;
  generateEnvFile(): Promise<string>;
  updateEnvVars(vars: Record<string, string>): void;
}
```

**配置存储位置**：
- `/workspace/.env` - 环境变量文件
- `/workspace/config/services.json` - 服务配置

### 3. MCP 服务器管理

支持 Model Context Protocol，用于 AI 辅助开发：

```typescript
interface McpManager {
  registerServers(servers: McpServer[]): Promise<void>;
  startServer(name: string): Promise<void>;
  stopServer(name: string): Promise<void>;
  getServerStatus(name: string): ServerStatus;
  listServers(): McpServer[];
}
```

### 4. WebSocket 客户端

- 连接主机 WebSocket 服务器
- 心跳保活机制（30秒间隔）
- 消息队列与重试机制
- TLS/SSL 支持
- 支持 terminal 会话复用

### 5. Web Terminal

- 基于 xterm.js 协议的 WebSocket 终端
- 支持 PTY（伪终端）
- 动态窗口大小调整
- 会话持久化与重连
- 命令历史记录

### 6. Git 管理器

| 功能 | 描述 |
|------|------|
| 分支创建 | 根据 taskType 自动添加前缀 (bug/, feature/, hotfix/) |
| Commit | 自动化提交，带语义化消息 |
| Push | 可选自动推送到远程 |
| 分支列表 | 查看当前分支状态 |

### 7. 任务处理器

- 解析任务描述
- 文件创建与修改
- 调用 open-spec 初始化
- 任务状态跟踪
- 超时检测
- 人工协助触发

### 8. 人工协助处理器

任务异常时向主机请求人工介入：

```typescript
interface AssistHandler {
  requestAssist(reason: AssistReason, taskId: string, message: string): Promise<void>;
  escalate(taskId: string, context: Record<string, unknown>): Promise<void>;
  resolve(taskId: string): Promise<void>;
}

type AssistReason = 'timeout' | 'error' | 'blocked' | 'completed';
```

### 9. OpenSpec 初始化器

- 解析 open-spec 规范
- 生成标准项目结构
- 集成开发工作流

## 消息流程

### 启动与注册流程

```
Docker Developer              主机
  │                            │
  │─────── Register ──────────▶│
  │  {bot_type: "docker-dev",  │
  │   version, capabilities}   │
  │                            │
  │◀─────── Env Config ───────│
  │  {database, redis, mcp}    │
  │                            │
  │◀─────── Credential ───────│
  │  {git_ssh_key}             │
  │                            │
  │◀─────── Credential ───────│
  │  {known_hosts}              │
  │                            │
  │◀─────── Ready ───────────│
  │  {status: "ready"}         │
```

### 任务执行流程

```
Docker Developer              主机
  │                            │
  │◀─────── Task ─────────────│
  │  {taskId, description}     │
  │                            │
  │─────── Notification ─────▶│
  │  {task_started}           │
  │                            │
  │─────── Notification ─────▶│
  │  {branch_created}          │
  │                            │
  │      [执行开发任务]         │
  │                            │
  │─────── Notification ─────▶│
  │  {commit_completed}        │
  │                            │
  │─────── Result ──────────▶│
  │  {taskId, status}          │
```

### 人工协助流程

```
Docker Developer              主机
  │                            │
  │      [任务超时/错误]        │
  │                            │
  │─────── Assist Request ───▶│
  │  {taskId, reason, message} │
  │                            │
  │◀─────── Assist Response ──│
  │  {action, guidance}       │
  │                            │
  │      [继续执行]            │
  │                            │
```

### MCP 配置流程

```
Docker Developer              主机
  │                            │
  │◀─────── MCP Config ───────│
  │  {servers: [{name, cmd}]}  │
  │                            │
  │─────── Notification ─────▶│
  │  {mcp_ready, servers}     │
  │                            │
  │◀─────── MCP Request ─────│
  │  {tool, params}           │
  │                            │
  │─────── MCP Response ─────▶│
  │  {result}                  │
```

## Nginx 配置

```nginx
server {
    listen 8080;
    server_name _;

    location /terminal/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    location /app/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws/ {
        proxy_pass http://localhost:8765/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

## 暴露端口

### 固定端口（容器内部服务）

| 端口 | 服务 | 说明 |
|------|------|------|
| 3000 | WebSocket Terminal | 终端服务 |
| 3001 | Dev Server | 开发服务器 |
| 8765 | WebSocket Client | 主服务连接端口 |

### 动态端口（主机映射）

| 端口 | 服务 | 说明 |
|------|------|------|
| 8080+N | Nginx/Web Terminal | 主机分配的 Web 访问端口 |
| 2222 | SSH | 可选：直接 SSH 接入 |

### 端口分配策略

- 主机通过 `container assign` 消息分配外部端口
- 基础端口：8080 + (container_index × 10)
- 端口范围：8080-8990（最多 91 个容器）
- 端口映射示例：
  ```
  Container[0]: 8080 → 3000, 8081 → 3001
  Container[1]: 8090 → 3000, 8091 → 3001
  ```

### 端口数量

| 类型 | 数量 | 说明 |
|------|------|------|
| Web 访问端口 | 91 | 8080-8990 |
| SSH 端口 | 91 | 2222-2312 |

## 环境变量

```bash
WS_ENDPOINT=wss://host:8765/developer
WORKSPACE=/workspace
GIT_USER_NAME=Developer Bot
GIT_USER_EMAIL=developer@example.com
TZ=Asia/Shanghai
CONTAINER_ID=docker-dev-{uuid}
BOT_TYPE=docker-developer
TASK_TIMEOUT=3600
```

## 配置项

```yaml
# config.yaml
websocket:
  host: "host.docker.internal"
  port: 8765
  path: "/developer"
  reconnectInterval: 3000
  maxReconnectAttempts: 10
  heartbeatInterval: 30000

ssh:
  gitKeyPath: "/home/developer/.ssh/id_rsa"
  hostKeyPath: "/home/developer/.ssh/host_key"
  knownHostsPath: "/home/developer/.ssh/known_hosts"

git:
  remote: "origin"
  autoPush: false
  commitPrefix: "[docker-developer]"
  userName: "Developer Bot"
  userEmail: "developer@example.com"

terminal:
  port: 3000
  shell: "/bin/bash"
  maxSessions: 5

openSpec:
  templatePath: "./templates"
  autoInitialize: true

task:
  defaultTimeout: 3600
  maxRetries: 3

mcp:
  enabled: true
  configPath: "/workspace/.mcp.json"

developer:
  workspace: "/workspace"
  logLevel: "info"
  containerId: "${CONTAINER_ID}"
```

## 错误处理

| 错误类型 | 处理策略 |
|----------|----------|
| 连接断开 | 自动重连，带指数退避（最大 5 分钟） |
| Git 冲突 | 暂停任务，发送错误通知 |
| 任务解析失败 | 返回错误结果，保持连接 |
| open-spec 初始化失败 | 回滚并重试一次 |
| 密钥无效 | 发送错误通知，要求重新发送 |
| 终端会话超时 | 保持会话 30 分钟，超时关闭 |
| 端口冲突 | 报告主机，请求重新分配 |
| 容器启动失败 | 发送 container ready 错误状态 |
| **任务超时** | **请求人工协助** |
| **任务错误** | **请求人工协助** |
| **MCP 服务异常** | **自动重启，请求人工协助** |

## 安全考虑

- WebSocket 连接使用 WSS（生产环境）
- 不存储敏感凭证，使用环境变量
- 密钥文件权限必须为 600
- 隔离的工作目录，防止越权访问
- 终端会话使用随机 sessionId
- 请求来源验证
- 端口隔离，防止端口冲突
- MCP 服务沙箱隔离
