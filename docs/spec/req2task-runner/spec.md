# req2task-runner 规范

## 概述

req2task-runner 是一个运行在 Linux 服务器上的后台程序（类似 GitLab Runner），负责与主机通信，管理开发机器人的生命周期。

## 核心职责

1. **注册与心跳** - 启动后向主机注册，报告在线状态和系统信息
2. **Docker 管理** - 根据主机指令创建、启动、销毁开发机器人容器
3. **端口分配** - 管理可用端口池，分配给开发机器人
4. **任务分发** - 将主机任务路由到对应的开发机器人
5. **状态监控** - 监控开发机器人的运行状态和健康检查

## 技术架构

### 基础信息

- 语言：Rust
- 运行时：Linux
- 通信协议：WebSocket

### 通信协议

```rust
#[derive(Serialize, Deserialize)]
struct WebSocketMessage {
    msg_type: String,
    payload: serde_json::Value,
    timestamp: String,
}

#[derive(Serialize, Deserialize)]
struct RunnerRegisterPayload {
    runner_id: String,
    hostname: String,
    capabilities: RunnerCapabilities,
    system_info: SystemInfo,
}

#[derive(Serialize, Deserialize)]
struct RunnerCapabilities {
    docker_available: bool,
    docker_version: Option<String>,
    max_containers: usize,
    supported_bots: Vec<String>,
}

#[derive(Serialize, Deserialize)]
struct SystemInfo {
    os: String,
    os_version: String,
    arch: String,
    ip_address: String,
    cpu_count: usize,
    memory_total: u64,
    disk_total: u64,
    docker_version: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct ContainerCreatePayload {
    container_id: String,
    bot_type: String,
    ports: Vec<PortMapping>,
    env: std::collections::HashMap<String, String>,
    volume_mounts: Vec<VolumeMount>,
}

#[derive(Serialize, Deserialize)]
struct PortMapping {
    internal: u16,
    external: u16,
    protocol: String,
}

#[derive(Serialize, Deserialize)]
struct VolumeMount {
    host_path: String,
    container_path: String,
    read_only: bool,
}
```

### 消息类型

| type | 方向 | 说明 |
|------|------|------|
| `register` | Runner → Host | 注册 Runner |
| `heartbeat` | Runner ↔ Host | 心跳保活 |
| `container.create` | Host → Runner | 创建容器 |
| `container.start` | Host → Runner | 启动容器 |
| `container.stop` | Host → Runner | 停止容器 |
| `container.remove` | Host → Runner | 删除容器 |
| `container.status` | Runner ↔ Host | 容器状态 |
| `container.ready` | Runner → Host | 容器就绪 |
| `runner.status` | Runner → Host | Runner 状态报告 |
| `error` | Runner ↔ Host | 错误信息 |

### 目录结构

```
req2task-runner/
├── src/
│   ├── main.rs
│   ├── config.rs           # 配置管理
│   ├── websocket/
│   │   ├── mod.rs
│   │   └── client.rs       # WebSocket 客户端
│   ├── docker/
│   │   ├── mod.rs
│   │   ├── client.rs       # Docker API 客户端
│   │   └── manager.rs      # 容器管理器
│   ├── port/
│   │   ├── mod.rs
│   │   └── allocator.rs    # 端口分配器
│   ├── runner/
│   │   ├── mod.rs
│   │   └── registry.rs     # Runner 注册
│   └── types/
│       └── mod.rs           # 类型定义
├── Cargo.toml
└── README.md
```

## 功能模块

### 1. WebSocket 客户端

- 连接主机 WebSocket 服务器
- 自动重连机制（指数退避）
- 心跳保活（30秒间隔）
- 消息队列与重试
- TLS/SSL 支持

### 2. Docker 管理器

- 容器生命周期管理
- 镜像拉取与缓存
- 端口映射
- 卷挂载
- 日志收集
- 健康检查

### 3. 端口分配器

```rust
struct PortAllocator {
    base_port: u16,
    used_ports: std::collections::HashSet<u16>,
    port_range: (u16, u16),
}

impl PortAllocator {
    fn allocate(&mut self) -> Result<u16, PortError>;
    fn release(&mut self, port: u16);
    fn get_available_ports(&self) -> Vec<u16>;
}
```

### 4. Runner 注册

启动时发送注册消息：

```json
{
  "type": "register",
  "payload": {
    "runner_id": "runner-001",
    "hostname": "dev-server-01",
    "capabilities": {
      "docker_available": true,
      "docker_version": "24.0.0",
      "max_containers": 10,
      "supported_bots": ["docker-developer", "python-developer"]
    },
    "system_info": {
      "os": "Linux",
      "os_version": "Ubuntu 22.04",
      "arch": "x86_64",
      "ip_address": "192.168.1.100",
      "cpu_count": 8,
      "memory_total": 17179869184,
      "disk_total": 500000000000
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 消息流程

### Runner 启动流程

```
Runner                      主机
  │                          │
  │─────── Register ─────────▶│
  │  {runner_id, capabilities} │
  │  {system_info}            │
  │                          │
  │◀─────── Ack ─────────────│
  │  {runner_id, status}      │
  │                          │
  │◀─────── Ready ──────────│
```

### 容器创建流程

```
主机                      Runner
  │                          │
  │──── Container Create ────▶│
  │  {container_id, bot_type} │
  │  {ports, env}            │
  │                          │ → 分配端口
  │                          │ → 拉取镜像
  │                          │ → 创建容器
  │                          │
  │◀──── Container Ready ────│
  │  {container_id, ports,   │
  │   endpoint}              │
```

### Runner 心跳流程

```
Runner                      主机
  │                          │
  │─────── Heartbeat ───────▶│
  │  {runner_id, status,      │
  │   containers}             │
  │                          │
  │◀─────── Heartbeat ───────│
  │  {runner_id, commands}    │
```

## 配置项

```yaml
# config.yaml
runner:
  id: "runner-001"
  token: "${RUNNER_TOKEN}"
  max_containers: 10

websocket:
  url: "wss://host:8765/runner"
  reconnect_interval: 3000
  max_reconnect_attempts: 10
  heartbeat_interval: 30000

docker:
  host: "unix:///var/run/docker.sock"
  registry: "zhcoder-docker-registry.com:8000"
  image_pull_timeout: 300

port:
  base: 8080
  range_start: 8080
  range_end: 8990

log:
  level: "info"
  path: "/var/log/req2task-runner"
```

## 环境变量

```bash
RUNNER_ID=runner-001
RUNNER_TOKEN=xxx
WS_URL=wss://host:8765/runner
DOCKER_HOST=unix:///var/run/docker.sock
RUST_LOG=info
```

## 错误处理

| 错误类型 | 处理策略 |
|----------|----------|
| 连接断开 | 自动重连，指数退避 |
| Docker 不可用 | 报告主机，标记为不可用 |
| 端口冲突 | 自动重试，分配下一个可用端口 |
| 容器启动失败 | 重试 3 次，报告主机 |
| 镜像拉取失败 | 重试 3 次，报告主机 |

## 安全考虑

- 使用 Token 认证
- Docker socket 权限控制
- 容器资源限制（CPU、内存）
- 网络隔离
- 日志审计
