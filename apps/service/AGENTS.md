# @req2task/service

## 开发指南

### 启动开发服务器

```bash
pnpm dev:service
# 或直接
cd apps/service
pnpm start:dev
```

### 构建

```bash
pnpm build:service
# 或
cd apps/service && pnpm build
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
cd apps/service && pnpm lint
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
