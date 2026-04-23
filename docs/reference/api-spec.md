---
last_updated: 2026-04-20
status: active
owner: req2task团队
---

# API 规范文档

本文档按业务模块拆分为多个文件。

## 文档结构

| 文档 | 模块 |
|------|------|
| [api-project.md](api-project.md) | 项目管理 |
| [api-requirement.md](api-requirement.md) | 需求管理 |
| [api-task.md](api-task.md) | 任务管理 |
| [api-collection.md](api-collection.md) | 原始需求收集 |
| [api-ai-chat.md](api-ai-chat.md) | AI Chat 对话 |
| [api-ai-generate.md](api-ai-generate.md) | AI 生成（需求生成、任务分解） |
| [api-llm-config.md](api-llm-config.md) | LLM 配置管理 |
| [api-conversation.md](api-conversation.md) | 会话管理 |

## 通用规范

### 认证方式

所有 API 需要在请求头中携带 JWT Token：

```
Authorization: Bearer <token>
```

### 统一响应格式

**成功响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

**分页响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

**错误响应：**

```json
{
  "code": "VALIDATION_ERROR",
  "message": "请求参数验证失败",
  "errors": [
    { "field": "name", "message": "名称不能为空" }
  ]
}
```

### 常用 HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 204 | 删除成功（无内容） |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### SSE 流式响应

部分 API 支持 Server-Sent Events（SSE）流式响应，返回 `Content-Type: text/event-stream`。

**SSE 事件格式：**

```json
// 元数据事件
data: {"type": "metadata", "conversationId": "xxx", "messageId": "yyy"}

// 内容事件
data: {"type": "content", "content": "部分内容..."}

// 完成事件
data: {"type": "metadata", "followUpQuestions": ["问题1?"], "isComplete": false}

// 错误事件
data: {"type": "error", "error": "错误信息"}

// 结束标记
data: [DONE]
```
