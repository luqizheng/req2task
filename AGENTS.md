# AGENTS.md

## 项目背景

req2task（需求转任务）是一个软件需求管理系统，支持需求全生命周期管理、多维度信息关联、AI 辅助需求生成、变更追溯、项目进度可视化和项目知识库构建，为项目经理提供决策支持。

目标用户：需求分析师、开发人员、项目经理

## 项目概述

req2task 是一个基于 pnpm monorepo 的全栈应用，包含 Vue 3 前端、NestJS 后端及多个基础服务。

## 技术栈

- **包管理器**: pnpm@9.0.0
- **前端**: Vue 3 + Vite + Pinia + Vue Router
- **后端**: NestJS + TypeORM + PostgreSQL
- **语言**: TypeScript
- **包编译**: tsup（用于 packages/ 下的共享包）
- **对象存储**: RustFS API 兼容 MinIO（S3 协议）
- **API Gateway**: Rust + Pingora + Nacos（支持 HTTP/WebSocket/SSE）

## 全局命令

```bash
pnpm dev:web                  # 启动前端开发服务器
pnpm dev:service              # 启动后端开发服务器（自动检查4000端口占用情况）
pnpm dev:ai-chat-service      # 启动 AI 聊天服务
pnpm dev:file-conversion      # 启动文件转换服务
pnpm dev:gateway              # 启动 Rust API Gateway（需要先启动 pnpm dev:infra）
pnpm dev:infra                # 启动开发基础设施服务（PostgreSQL, Redis, ChromaDB, Nacos等）
pnpm dev:infra:stop           # 停止开发基础设施服务
pnpm check:env                # 检查开发环境工具（Node.js, pnpm, Docker等）
pnpm build                    # 构建所有应用
pnpm build:web                # 构建前端
pnpm build:service            # 构建后端
pnpm build:gateway            # 构建 Rust API Gateway
pnpm lint                     # 检查所有代码
pnpm lint:fix                 # 修复所有包的 lint 问题
pnpm lint:check               # 检查所有包的 lint 问题（详细报告）
pnpm lint:remove-unused       # 检测未使用的导入（默认扫描后端）
pnpm lint:remove-unused:fix   # 自动移除未使用的导入
pnpm test                     # 运行所有测试
pnpm test:web                 # 运行前端测试
pnpm test:e2e:web             # 运行前端 E2E 测试
pnpm test:e2e                 # 运行后端 E2E 测试
pnpm test:all                 # 运行所有测试（包括 E2E）
pnpm db:migration:generate     # 生成数据库迁移
pnpm db:migration:run          # 运行数据库迁移
pnpm db:migration:revert       # 回滚数据库迁移
pnpm db:migration:show        # 查看迁移状态
pnpm db:reset                 # 重置数据库
pnpm db:seed                  # 填充数据库
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
├── service/       # NestJS 后端
├── ai-chat-service/  # AI 聊天服务（对话管理、LLM 集成）
├── file-conversion/ # 文件转换服务（PDF、Docx、音频等格式转换）
└── api-gateway/   # Rust API Gateway（Pingora + Nacos，支持 HTTP/WebSocket/SSE）
```

## 子包 AGENTS.md

各子包有独立的 AGENTS.md 文件，包含该包的特定规则和指南：

- [apps/web/AGENTS.md](apps/web/AGENTS.md) - Vue 3 前端开发规范（含 SSE 通信规范）
- [apps/service/AGENTS.md](apps/service/AGENTS.md) - NestJS 后端开发规范（含 SSE 通信规范）
- [apps/ai-chat-service/AGENTS.md](apps/ai-chat-service/AGENTS.md) - AI 聊天服务开发规范（含 SSE 通信规范）
- [apps/file-conversion/AGENTS.md](apps/file-conversion/AGENTS.md) - 文件转换服务开发规范
- [apps/api-gateway/](apps/api-gateway/) - Rust API Gateway 开发规范（Pingora + Nacos）

## SSE 通信规范

所有涉及 SSE (Server-Sent Events) 通信的子包必须遵循 [SSE 通信协议](docs/reference/sse-protocol.md)：

- Web 前端：负责 SSE 事件解析和 UI 更新
- Service 后端：负责需求分析场景的 SSE 流处理
- AI Chat Service：负责对话场景的 SSE 流处理

## DTO 包规则

**重要**：Web 和 Service 交互的 Request/Response DTO 必须定义在 `packages/dto` 中：

- 确保前后端类型一致
- 单一来源，避免重复定义
- 支持 API 类型自动补全

## 包编译规则（tsup）

`packages/` 目录下的所有共享包必须使用 tsup 进行编译：

### 编译要求

- 所有包必须配置 `tsup.config.ts`
- 输出格式：ESM + CJS 双格式
- 禁止使用 tsc 直接编译包
- 使用 `packages/dev-config` 提供的基础配置

### 配置示例

```typescript
// tsup.config.ts
import { defineConfig } from "tsup";
import { baseTsupConfig } from "@req2task/dev-config/tsup";

export default defineConfig([
  {
    ...baseTsupConfig[0],
    entry: ["src/index.ts"],
  },
  {
    ...baseTsupConfig[1],
    entry: ["src/index.ts"],
  },
]);
```

### 构建命令

- `pnpm build:web` - 构建前端（使用 Vite）
- `packages/` 下的包随依赖它的应用自动构建

## 代码风格

- 使用 ESLint + Prettier
- TypeScript 严格模式
- 提交前自动运行 lint-staged（配置于 package.json）

## 代码质量检查规则

项目使用增强的 ESLint 规则来保证代码质量：

### 必须遵守的规则

1. **no-console 规则**：禁止使用 `console.log`，只允许 `console.warn` 和 `console.error`
   - 错误示例：`console.log('debug info')`
   - 正确示例：`console.warn('warning')` 或 `console.error('error message')`

2. **no-debugger 规则**：禁止使用 `debugger` 语句

3. **no-unused-vars 规则**：禁止未使用的变量和导入
   - 变量名以下划线 `_` 开头可豁免：`const _unusedVar = 'test'`
   - 函数参数以下划线 `_` 开头可豁免：`function test(_unusedParam: string) {}`

4. **no-explicit-any 规则**：警告使用 `any` 类型，推荐使用具体类型

### 自动修复工具

项目提供了自动修复工具：

```bash
# 扫描所有包的 lint 问题
pnpm lint:check

# 自动修复所有包的 lint 问题
pnpm lint:fix

# 专门检测和移除未使用的导入
pnpm lint:remove-unused              # 检测（默认扫描后端）
pnpm lint:remove-unused --web        # 检测前端
pnpm lint:remove-unused --service    # 检测后端
pnpm lint:remove-unused --packages   # 检测 packages
pnpm lint:remove-unused --all        # 检测所有包
pnpm lint:remove-unused:fix          # 自动移除未使用的导入
```

### 豁免规则的文件

以下文件的 `no-console` 规则被豁免：
- 所有 `*.spec.ts` 测试文件
- 所有 `*.test.ts` 测试文件

### 配置文件位置

- 前端：`apps/web/eslint.config.js`（ESLint 9 flat config）
- 后端：`apps/service/.eslintrc.cjs`（ESLint 8 rc config）
- 其他包：各自的 `.eslintrc.cjs`

## 硬性规则（必须遵守，CI 会验证）

1. **开发环境启动规则**：启动开发环境或测试环境时，必须使用全局命令（根目录 `package.json` 中定义的命令），禁止直接在子目录运行 `npm run dev` 或 `pnpm dev`。全局命令可确保基础设施服务和所有依赖服务正确启动。如果命令不存在，请警告并且提示用户添加。
2. **文件行数限制**（降低阅读压力，便于代码审查）
   - `_.ts/_.tsx` 单文件不超过 300 行
   - `_.vue` 单文件不超过 500 行
   - `_.spec.ts` 单文件不超过 2300 行
   - **超出时必须拆分**：按功能模块、组件职责、数据流向等维度拆分文件
   - **推荐使用 useXXX 组合式函数**：复杂逻辑抽离为独立文件，便于复用和测试
     ```
     组件.vue (< 500 行，视图层)
     ├── useFormLogic.ts   # 表单相关逻辑
     ├── useDataFetch.ts   # 数据获取逻辑
     └── useValidation.ts  # 验证逻辑
     ```
3. 新增代码必须有对应测试
4. **禁止使用 console.log**：使用 `console.warn` 或 `console.error` 替代，或使用结构化日志库
5. 项目不需要考虑数据迁移、api接口兼容问题。请激进重构。只讲合不合理。
6. **提交前必须通过 lint 检查**：运行 `pnpm lint` 确保代码符合规范
7. **定期清理未使用的导入**：使用 `pnpm lint:remove-unused:fix` 自动清理

**强制要求**：所有开发活动必须严格遵守 [.agents/rules/dev-rules.md](.agents/rules/dev-rules.md) 中的规则。

## 文档导航

| 你想做什么             | 去哪里看                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| 了解系统架构           | [docs/architecture/overview.md](docs/architecture/overview.md)           |
| 了解模块边界和依赖规则 | [docs/design/module-design.md](docs/design/module-design.md)             |
| 了解数据库设计         | [docs/design/database-design.md](docs/design/database-design.md)         |
| 了解 API 规范          | [docs/reference/api-spec.md](docs/reference/api-spec.md)                 |
| 了解实施计划           | [docs/design/implementation-plan.md](docs/design/implementation-plan.md) |
| 了解编码规范           | [.agents/rules/dev-rules.md](.agents/rules/dev-rules.md)                 |
| 了解代码质量检查规则   | [AGENTS.md#代码质量检查规则](#代码质量检查规则)                           |
| Bug修复流程            | [.agents/rules/bug-fix-rules.md](.agents/rules/bug-fix-rules.md)         |
| 了解完整文档索引       | [docs/README.md](docs/README.md)                                         |
| 查看用户手册           | [docs/manuals/index.md](docs/manuals/index.md)                           |

### 文档层级

- **docs/architecture/** - 架构层（系统架构、技术栈、模块关系）
- **docs/design/** - 设计层（数据库设计、模块设计、AI设计）
- **docs/prd/** - PRD 层（业务模型、功能流程、需求规范）
- **docs/reference/** - 参考层（API规范、错误码）
- **docs/conventions/** - 规范层（命名规范、错误处理、日志规范）
