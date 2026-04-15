# AGENTS.md 创建计划

## 项目概况分析

- **项目类型**: pnpm monorepo
- **包管理器**: pnpm@9.0.0
- **应用**: 
  - `@req2task/service` (NestJS 后端)
  - `@req2task/web` (Vue 3 前端)

## 实现步骤

1. **创建根目录 AGENTS.md**
   - 项目概述和架构说明
   - 全局开发命令（dev、build、lint、test）
   - Monorepo 工作流说明
   - 代码风格指南

2. **创建 apps/service/AGENTS.md**
   - NestJS 开发指南
   - 数据库配置（TypeORM + PostgreSQL）
   - 测试命令和覆盖率
   - API 开发规范

3. **创建 apps/web/AGENTS.md**
   - Vue 3 + Vite 开发指南
   - 状态管理（Pinia）
   - 路由配置
   - 前端测试和类型检查

## 关键命令参考

| 命令 | 说明 |
|------|------|
| `pnpm dev:web` | 启动前端开发服务器 |
| `pnpm dev:service` | 启动后端开发服务器 |
| `pnpm build` | 构建所有应用 |
| `pnpm lint` | 检查所有代码 |
| `pnpm test` | 运行所有测试 |
