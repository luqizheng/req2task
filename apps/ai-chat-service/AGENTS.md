# @req2task/ai-chat-service

## 开发指南

### 启动开发服务器

```bash
pnpm dev:ai-chat-service
```

### 构建

```bash
pnpm build
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

- `src/routes/conversation.routes.ts` - 对话路由，处理 SSE 流
- `src/services/conversation.service.ts` - 会话服务
- `src/services/llm.service.ts` - LLM 服务封装

## 开发规范

1. 使用结构化日志，禁止 console.log
2. 遵循 SSE 协议定义的事件格式和错误码
3. 运行 lint 和 test 后再提交
