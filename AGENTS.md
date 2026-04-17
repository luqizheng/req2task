# AGENTS.md

## 项目背景

req2task（需求转任务）是一个软件需求管理系统，支持需求全生命周期管理、多维度信息关联、AI 辅助需求生成、变更追溯、项目进度可视化和项目知识库构建，为项目经理提供决策支持。

目标用户：需求分析师、开发人员、项目经理

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
pnpm dev:service    # 启动后端开发服务器（自动检查4000端口占用情况）
pnpm dev:infra      # 启动开发基础设施服务（PostgreSQL, Redis, ChromaDB等）
pnpm dev:infra:stop # 停止开发基础设施服务
pnpm check:env      # 检查开发环境工具（Node.js, pnpm, Docker等）
pnpm build          # 构建所有应用
pnpm build:web      # 构建前端
pnpm build:service  # 构建后端
pnpm lint           # 检查所有代码
pnpm test           # 运行所有测试
pnpm test:e2e       # 运行端到端测试
pnpm db:migration:generate # 生成数据库迁移
pnpm db:migration:run      # 运行数据库迁移
pnpm db:migration:revert   # 回滚数据库迁移
pnpm db:migration:show     # 查看迁移状态
```

## Monorepo 工作流

- 使用 `pnpm --filter <package>` 针对特定包执行命令
- 工作区配置位于 `pnpm-workspace.yaml`
- 应用位于 `apps/` 目录下

## 包结构

```
packages/
├── core/          # 后端核心业务代码（实体、服务）
├── dto/           # 前后端共享 DTO 定义
apps/
├── web/           # Vue 3 前端
└── service/       # NestJS 后端
```

## 子包 AGENTS.md

各子包有独立的 AGENTS.md 文件，包含该包的特定规则和指南：

- [apps/web/AGENTS.md](apps/web/AGENTS.md) - Vue 3 前端开发规范
- [apps/service/AGENTS.md](apps/service/AGENTS.md) - NestJS 后端开发规范

## DTO 包规则

**重要**：Web 和 Service 交互的 Request/Response DTO 必须定义在 `packages/dto` 中：

- 确保前后端类型一致
- 单一来源，避免重复定义
- 支持 API 类型自动补全

## 代码风格

- 使用 ESLint + Prettier
- TypeScript 严格模式
- 提交前自动运行 lint-staged（配置于 package.json）

## 硬性规则（必须遵守，CI 会验证）

1. _.ts/_.tsx 单文件不超过 300 行, _.vue 单文件不超过 500 行, _.spec.ts 单文件不超过 2300 行
2. 新增代码必须有对应测试
3. 使用结构化日志，禁止 console.log

**强制要求**：所有开发活动必须严格遵守 [.agents/rules/dev-rules.md](.agents/rules/dev-rules.md) 中的规则。

## 文档导航

| 你想做什么 | 去哪里看 |
|-----------|---------|
| 了解系统架构 | [docs/architecture/overview.md](docs/architecture/overview.md) |
| 了解模块边界和依赖规则 | [docs/design/module-design.md](docs/design/module-design.md) |
| 了解数据库设计 | [docs/design/database-design.md](docs/design/database-design.md) |
| 了解 API 规范 | [docs/reference/api-spec.md](docs/reference/api-spec.md) |
| 了解实施计划 | [docs/design/implementation-plan.md](docs/design/implementation-plan.md) |
| 了解编码规范 | [.agents/rules/dev-rules.md](.agents/rules/dev-rules.md) |
| 了解完整文档索引 | [docs/README.md](docs/README.md) |

### 文档层级

- **docs/architecture/** - 架构层（系统架构、技术栈、模块关系）
- **docs/design/** - 设计层（数据库设计、模块设计、AI设计）
- **docs/prd/** - PRD 层（业务模型、功能流程、需求规范）
- **docs/reference/** - 参考层（API规范、错误码）
- **docs/conventions/** - 规范层（命名规范、错误处理、日志规范）
