# req2task-runner

req2task 的 Linux 后台程序，负责与主机通信并管理开发机器人容器。

## 功能

- 与主机 WebSocket 服务通信
- 管理 Docker 容器生命周期
- 端口分配与管理
- Runner 注册与心跳
- 容器状态监控

## 构建

```bash
cargo build --release
```

## 运行

```bash
# 设置环境变量
export RUNNER_ID="runner-001"
export RUNNER_TOKEN="your-token"
export WS_URL="ws://localhost:8765/runner"

# 运行
./target/release/req2task-runner
```

## 配置

编辑 `config.yaml` 或使用环境变量覆盖：

| 环境变量 | 说明 |
|----------|------|
| RUNNER_ID | Runner 唯一标识 |
| RUNNER_TOKEN | 认证 Token |
| WS_URL | WebSocket 服务地址 |
| DOCKER_HOST | Docker Socket 地址 |
| RUST_LOG | 日志级别 |

## Systemd 服务

```ini
[Unit]
Description=req2task-runner
After=network.target docker.service

[Service]
Type=simple
User=root
Environment=RUST_LOG=info
ExecStart=/usr/local/bin/req2task-runner
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## 消息协议

### Runner → Host

| 消息类型 | 说明 |
|----------|------|
| register | 注册 Runner |
| heartbeat | 心跳保活 |
| container.created | 容器创建成功 |
| container.started | 容器启动成功 |
| container.stopped | 容器停止成功 |
| container.removed | 容器删除成功 |
| error | 错误信息 |

### Host → Runner

| 消息类型 | 说明 |
|----------|------|
| container.create | 创建容器 |
| container.start | 启动容器 |
| container.stop | 停止容器 |
| container.remove | 删除容器 |
| container.status | 查询容器状态 |
| runner.status | 查询 Runner 状态 |
