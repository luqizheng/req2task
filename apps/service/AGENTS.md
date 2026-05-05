# @req2task/service

## 开发指南

### 启动开发服务器

```bash
pnpm dev:service
```

### 构建

```bash
pnpm build:service
```

## 测试

```bash
pnpm test               # 运行单元测试
pnpm test:watch         # 监听模式运行测试
pnpm test:cov           # 生成覆盖率报告
pnpm test:e2e           # 运行端到端测试
```

## 代码检查

```bash
pnpm lint
# 或
pnpm --filter @req2task/service lint
```

### 自动修复未使用的导入

项目提供了专门的工具来检测和移除未使用的导入：

```bash
# 从根目录运行（推荐）
pnpm lint:remove-unused              # 检测未使用的导入
pnpm lint:remove-unused:fix          # 自动移除

# 或在 service 目录运行
cd apps/service && npx tsx ../../scripts/remove-unused-imports.ts --fix
```

### 强制规则

- **禁止 console.log**：使用 `console.warn` 或 `console.error`
- **禁止 debugger**：使用断点调试
- **禁止未使用的导入**：定期运行 `pnpm lint:remove-unused:fix`
- **测试文件豁免**：`*.spec.ts` 文件豁免 console 和未使用变量检查
- **禁止独立 AI Controller**：不得创建独立的 AI 相关 Controller（如 `*-controller.ts`），AI 能力必须集成到业务 Controller 中。例如：生成任务功能应放在 `tasks.controller.ts`，而非单独的 AI Controller

## 架构

- **框架**: NestJS
- **ORM**: TypeORM
- **数据库**: PostgreSQL（配置于 .env.example）
- **验证**: class-validator + class-transformer

## 关键文件

- `src/main.ts` - 应用入口
- `src/app.module.ts` - 根模块
- `src/app.controller.ts` - 根控制器
- `src/app.service.ts` - 根服务

## AI 服务模块

### 目录结构

```
src/ai/
├── ai.module.ts                      # AI 模块根模块
├── ai.service.ts                     # 基础 AI 服务
├── ai-generation.service.ts          # 需求生成服务
├── ai-persistence.service.ts         # 持久化服务
├── llm-client.service.ts             # LLM 客户端
├── requirement-vector.service.ts      # 需求向量化服务
├── requirement-relation-detection.service.ts  # 关联检测服务
├── vector-store.providers.ts         # 向量存储 DI 配置
├── prompts/                          # Prompt 模板
└── ...
```

### 核心服务

| 服务 | 职责 |
|------|------|
| AiGenerationService | 需求生成流程编排 |
| AiPersistenceService | 需求持久化 + 向量索引 |
| RequirementVectorService | 需求向量化存储/检索 |
| RequirementRelationDetectionService | 相似/冲突需求检测 |

### 需求关联检测流程

```
1. generateRequirements() 调用 detectRelations()
2. RequirementVectorService.searchSimilarRequirements() 向量搜索
3. RequirementRelationDetectionService 分析冲突关键词
4. 返回 relatedRequirements + conflictRequirements
5. 注入到 prompt 的 relatedRequirements 参数
6. AI 生成需求时考虑关联关系
7. persistRequirements() 时自动索引新需求
```

### 向量重建命令

```bash
# 重建所有向量
pnpm rebuild:vector

# 仅重建指定项目
pnpm rebuild:vector -p <project-id>
```

## SSE 通信规范

**强制要求**：所有 SSE (Server-Sent Events) 通信必须严格遵守 [SSE 通信协议](../../docs/reference/sse-protocol.md)。

### 核心规则

1. **事件类型**：必须使用 `metadata`、`content`、`message`、`done`、`error` 五种标准事件类型
2. **metadata 事件**：流开始时必须发送，包含会话上下文信息
3. **content 事件**：仅传输增量内容片段
4. **结束标记**：成功结束使用 `data: [DONE]\n\n`，错误结束使用 `data: {"type": "error", "message": "<error>"}\n\n`
5. **AI 响应转发**：转发 AI 服务响应时必须解包并重发为统一格式

### 关键文件

- `src/raw-requirement-collection/raw-requirement-collection.controller.ts` - 需求分析 SSE 流处理

## 开发规范

1. 使用依赖注入（Constructor Injection）
2. 使用 DTO 进行请求/响应验证
3. 使用模块组织功能
4. 遵循 SSE 协议定义的事件格式和错误码
5. 运行 lint 和 test 后再提交
