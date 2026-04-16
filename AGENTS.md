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

**强制要求**：所有开发活动必须严格遵守 [.agents/rules/dev-rules.md](.agents/rules/dev-rules.md) 中的规则，包括但不限于：

- **输出规则**：简体中文、禁用客套语、直接输出
- **控制台规则**：Windows PowerShell、UTF-8 BOM 编码
- **代码规则**：无注释、遵循代码风格、Vue 使用 `<script setup>`、NestJS 使用构造函数注入
- **DTO 共享规则**：Web/Service 交互的 DTO 必须定义在 `packages/dto` 中
- **命名规范**：TypeScript/Vue/数据库/API 路由的命名约定
