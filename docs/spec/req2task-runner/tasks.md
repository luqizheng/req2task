# req2task-runner 任务清单

## 开发任务

### P0 - 核心功能

- [ ] 创建 Rust 项目结构
- [ ] 实现 WebSocket 客户端
- [ ] 实现 Runner 注册模块
- [ ] 实现 Docker 客户端
- [ ] 实现容器管理器
- [ ] 实现端口分配器
- [ ] 实现心跳机制

### P1 - 功能完善

- [ ] 配置管理（YAML/环境变量）
- [ ] 日志系统
- [ ] 错误处理与重试
- [ ] TLS/SSL 支持

### P2 - 测试与部署

- [ ] 单元测试
- [ ] 集成测试
- [ ] Systemd 服务配置
- [ ] 部署文档

## 依赖项

### Rust crates

- tokio (异步运行时)
- tokio-tungstenite (WebSocket)
- bollard (Docker API)
- serde (序列化)
- config (配置管理)
- tracing (日志)
- tokio-native-tls
