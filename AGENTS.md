# AGENTS.md

## 项目概述

req2task 是一个基于 pnpm monorepo 的全栈应用，包含 Vue 3 前端和 NestJS 后端。

## 技术栈

- **包管理器**: pnpm@9.0.0
- **前端**: Vue 3 + Vite + Pinia + Vue Router
- **后端**: NestJS + TypeORM + PostgreSQL
- **语言**: TypeScript

## 全局命令

```bash
pnpm dev:web        # 启动前端开发服务器
pnpm dev:service    # 启动后端开发服务器
pnpm dev:infra      # 启动开发基础设施服务（PostgreSQL, Redis, ChromaDB等）
pnpm dev:infra:stop # 停止开发基础设施服务
pnpm check:env      # 检查开发环境工具（Node.js, pnpm, Docker等）
pnpm build          # 构建所有应用
pnpm build:web      # 构建前端
pnpm build:service  # 构建后端
pnpm lint           # 检查所有代码
pnpm test           # 运行所有测试
pnpm test:e2e       # 运行端到端测试
```

## Monorepo 工作流

- 使用 `pnpm --filter <package>` 针对特定包执行命令
- 工作区配置位于 `pnpm-workspace.yaml`
- 应用位于 `apps/` 目录下

## 代码风格

- 使用 ESLint + Prettier
- TypeScript 严格模式
- 提交前自动运行 lint-staged（配置于 package.json）

## 规则

开发规则详见 [.agents/rules/dev-rules.md](.agents/rules/dev-rules.md)
