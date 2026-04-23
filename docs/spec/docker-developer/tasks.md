# Docker Developer 任务清单

## 开发任务

### P0 - 核心功能

- [ ] 创建项目结构和基础配置文件
- [ ] 实现 WebSocket 客户端模块
- [ ] 实现 SSH 密钥管理器
- [ ] 实现 Git 管理器模块
- [ ] 实现任务处理器模块
- [ ] 实现 OpenSpec 初始化器
- [ ] 创建 Dockerfile（基于 node:v22-slim）
- [ ] 创建 docker-compose.yml

### P1 - 环境配置

- [ ] 实现环境配置管理器
- [ ] 接收数据库配置
- [ ] 接收 Redis 配置
- [ ] 生成 .env 文件
- [ ] 接收服务配置

### P2 - MCP 支持

- [ ] 实现 MCP 客户端
- [ ] 实现 MCP 服务器管理器
- [ ] 注册 MCP 服务器
- [ ] 处理 MCP 请求/响应

### P3 - 人工协助

- [ ] 实现协助请求处理器
- [ ] 超时检测机制
- [ ] 错误分类与上报
- [ ] 协助响应处理

### P4 - 终端功能

- [ ] 实现 WebSocket 终端模块
- [ ] 实现 PTY 伪终端
- [ ] 实现会话管理（创建、重连、销毁）
- [ ] 集成 xterm.js 前端组件

### P5 - Nginx 配置

- [ ] 创建 nginx 配置
- [ ] 配置 WebSocket 代理
- [ ] 配置终端和应用代理
- [ ] 配置端口映射

### P6 - 功能完善

- [ ] 添加心跳保活机制
- [ ] 实现消息重试队列
- [ ] 添加配置管理
- [ ] 实现错误处理与日志

### P7 - 测试与文档

- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 编写使用文档

## 依赖项

### 运行时
- Node.js 22+
- xterm.js
- node-pty
- ws (WebSocket 库)
- simple-git
- yaml (配置解析)
- pino (日志)
- @modelcontextprotocol/sdk

### 开发环境
- TypeScript 5+
- Vitest
- @types/node
