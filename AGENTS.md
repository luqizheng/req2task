# AGENTS.md

## 项目背景

**利用LLM 进行开发的实践以及学习项目。因此一切以如何使用LLM为目标**

req2task（需求转任务）是一个软件需求管理系统，支持需求全生命周期管理、多维度信息关联、AI 辅助需求生成、变更追溯、项目进度可视化和项目知识库构建，为项目经理提供决策支持。

目标用户：需求分析师、开发人员、项目经理



## 项目概述

req2task 是一个基于 pnpm monorepo 的全栈应用，包含 Vue 3 前端、NestJS 后端及多个基础服务。

## 技术栈

- **包管理器**: pnpm@10.33.0
- **前端**: Vue 3 + Vite + Pinia + Vue Router
- **后端**: NestJS + TypeORM + PostgreSQL
- **语言**: TypeScript
- **包编译**: tsup（用于 packages/ 下的共享包）
- **对象存储**: RustFS API 兼容 MinIO（S3 协议）

## 常用命令

详见 [docs/reference/commands.md](docs/reference/commands.md)

## Monorepo 结构

```
packages/
├── core/          # 后端核心业务代码（实体、服务）
├── dto/           # 前后端共享 DTO 定义
apps/
├── web/           # Vue 3 前端
├── service/       # NestJS 后端
├── ai-chat-service/  # AI 聊天服务（对话管理、LLM 集成）
```

## 子包 AGENTS.md

- [apps/web/AGENTS.md](apps/web/AGENTS.md) - Vue 3 前端开发规范
- [apps/service/AGENTS.md](apps/service/AGENTS.md) - NestJS 后端开发规范
- [apps/ai-chat-service/AGENTS.md](apps/ai-chat-service/AGENTS.md) - AI 聊天服务开发规范

## DTO 包规则

**重要**：Web 和 Service 交互的 Request/Response DTO 必须定义在 `packages/dto` 中：

- 确保前后端类型一致
- 单一来源，避免重复定义
- 支持 API 类型自动补全

## 包编译规则（tsup）

`packages/` 目录下的所有共享包必须使用 tsup 进行编译：

- 所有包必须配置 `tsup.config.ts`
- 输出格式：ESM + CJS 双格式
- 禁止使用 tsc 直接编译包
- 使用 `packages/dev-config` 提供的基础配置

## 代码风格

- 使用 ESLint + Prettier
- TypeScript 严格模式
- 提交前自动运行 lint-staged

## 代码质量检查规则

详见 [.agents/rules/code-quality.md](.agents/rules/code-quality.md)

## 硬性规则（必须遵守，CI 会验证）

1. **开发环境启动规则**：启动开发环境或测试环境时，必须使用全局命令（根目录 `package.json` 中定义的命令），禁止直接在子目录运行 `npm run dev` 或 `pnpm dev`。
2. **文件行数限制**
   - `*.ts/*.tsx` 单文件不超过 300 行
   - `*.vue` 单文件不超过 500 行
   - `*.spec.ts` 单文件不超过 2300 行
3. 新增代码必须有对应测试
4. **禁止使用 console.log**：使用 `console.warn` 或 `console.error` 替代
5. 项目不需要考虑数据迁移、API 接口兼容问题。请激进重构。
6. **提交前必须通过 lint 检查**
7. **定期清理未使用的导入**

**强制要求**：所有开发活动必须严格遵守 [.agents/rules/dev-rules.md](.agents/rules/dev-rules.md) 中的规则。

## 文档导航

| 你想做什么             | 去哪里看                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| 了解系统架构           | [docs/architecture/overview.md](docs/architecture/overview.md)           |
| 了解模块边界和依赖规则 | [docs/design/modules/module-design.md](docs/design/modules/module-design.md) |
| 了解数据库设计         | [docs/design/data/database-design.md](docs/design/data/database-design.md) |
| 了解 API 规范          | [docs/reference/api-spec.md](docs/reference/api-spec.md)                 |
| 了解项目计划           | [docs/design/project/project-user-system-plan.md](docs/design/project/project-user-system-plan.md) |
| 了解编码规范           | [.agents/rules/dev-rules.md](.agents/rules/dev-rules.md)                 |
| 了解代码质量检查规则   | [.agents/rules/code-quality.md](.agents/rules/code-quality.md)           |
| 了解 MCP Tools         | [.agents/rules/mcp-tools.md](.agents/rules/mcp-tools.md)                 |
| Bug 修复流程           | [.agents/rules/bug-fix-rules.md](.agents/rules/bug-fix-rules.md)         |
| 查看用户手册           | [docs/manuals/index.md](docs/manuals/index.md)                           |

### 文档层级

- **docs/architecture/** - 架构层（系统架构、技术栈、模块关系）
- **docs/design/** - 设计层（数据库设计、模块设计、AI设计）
- **docs/prd/** - PRD 层（业务模型、功能流程、需求规范）
- **docs/reference/** - 参考层（API规范、错误码、命令）
- **docs/conventions/** - 规范层（命名规范、错误处理、日志规范）
