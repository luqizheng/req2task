# SSE 流式通信协议

## 概述

本文档定义 req2task 项目中前后端 SSE (Server-Sent Events) 流式通信的统一规范。所有使用 SSE 的 API 必须遵循此协议。

## 通用规范

### 请求头

```
Content-Type: application/json
Authorization: Bearer <token>
```

### SSE 响应头

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

### 事件格式

所有事件均为 JSON 格式，通过 `data:` 前缀发送：

```
data: {"type": "<event_type>", ...}
```

### 结束标记

- 成功结束：`data: [DONE]\n\n`
- 错误结束：`data: {"type": "error", "message": "<error>"}\n\n`

---

## 事件类型定义

### 1. analyze_start（需求分析开始事件）

**触发时机**：需求分析场景下，AI 开始分析前发送。

```typescript
interface AnalyzeStartEvent {
  type: "analyze_start";
  collectionId: string;                    // 收集项 ID
  prompts?: {
    systemPrompt: string;                  // 系统提示词
    userPrompt: string;                    // 用户提示词
  };
  requirementFiles?: Array<{                // 需求文件
    type: "text" | "docx" | "pdf" | "audio";
    data: string;
    name?: string;
  }>;
  projectAttachments?: Array<{              // 项目附件
    type: "text" | "docx" | "pdf" | "audio";
    data: string;
    name?: string;
  }>;
}
```

**示例**：
```json
{"type": "analyze_start", "collectionId": "col_456", "prompts": {"systemPrompt": "...", "userPrompt": "..."}}
```

---

### 2. conversation_start（会话开始事件）

**触发时机**：对话场景下，会话开始前发送。

```typescript
interface ConversationStartEvent {
  type: "conversation_start";
  conversationId: string;     // 会话 ID
  isNewConversation?: boolean; // 是否新会话
}
```

**示例**：
```json
{"type": "conversation_start", "conversationId": "conv_123", "isNewConversation": true}
```

---

### 3. content（内容事件）

**触发时机**：AI 返回流式内容时。

```typescript
interface ContentEvent {
  type: "content";
  content: string;  // 增量内容片段
  done?: boolean;   // 是否为最后一片段
}
```

**示例**：
```json
{"type": "content", "content": "这是"}
{"type": "content", "content": "AI 的"}
{"type": "content", "content": "回复内容", "done": true}
```

---

### 3. message（消息事件）

**触发时机**：AI 回复完整后，发送完整消息对象。

```typescript
interface MessageEvent {
  type: "message";
  message: {
    id: string;
    conversationId: string;
    role: "assistant" | "user" | "system";
    content: string;
    createdAt: string;
  };
}
```

**示例**：
```json
{"type": "message", "message": {"id": "msg_789", "conversationId": "conv_123", "role": "assistant", "content": "...", "createdAt": "2024-01-01T00:00:00Z"}}
```

---

### 4. done（完成事件）

**触发时机**：流式响应全部完成后。

```typescript
interface DoneEvent {
  type: "done";
  followUpQuestions?: string[];     // 追问建议
  keyElements?: string[];           // 关键要素
  extractedData?: Record<string, any>; // 提取的数据（需求分析场景）
}
```

**示例**：
```json
{"type": "done", "followUpQuestions": ["问题1", "问题2"], "keyElements": ["要素A", "要素B"]}
```

---

### 5. error（错误事件）

**触发时机**：发生错误时。

```typescript
interface ErrorEvent {
  type: "error";
  message: string;
  code?: string;
}
```

**示例**：
```json
{"type": "error", "message": "LLM 服务不可用", "code": "LLM_UNAVAILABLE"}
```

---

## 场景定义

### 场景 1：需求智能分析 (Requirement Analysis)

**API**: `POST /api/collections/:id/analyze/stream`

**流程**：
1. 客户端发送分析请求（支持文本、附件）
2. 服务端返回 `analyze_start` 事件
3. 服务端返回 `conversation_start` 事件
4. 服务端返回 `content` 流
5. 服务端返回 `message` 事件（完整消息）
6. 服务端返回 `done` 事件

**服务端实现要求**：
- 必须先发送 `analyze_start` 事件
- 然后发送 `conversation_start` 事件
- `content` 事件只包含增量内容
- 最后发送 `done` 事件
- 转发 AI 服务响应时需要解包重发（跳过 AI 服务发送的第一个 metadata 事件）

---

### 场景 2：AI 对话 (AI Chat)

**API**: `POST /api/ai-chat/ai/conversations/:id/messages/stream`

**流程**：
1. 客户端发送消息
2. 服务端返回 `conversation_start` 事件
3. 服务端返回 `content` 流
4. 服务端返回 `message` 事件（完整消息）
5. 服务端返回 `done` 事件

---

## 前端解析示例

```typescript
async function handleStream(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('Stream completed');
            return;
          }

          const event = JSON.parse(data);
          handleEvent(event);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function handleEvent(event: SSEEvent) {
  switch (event.type) {
    case 'analyze_start':
      handleAnalyzeStart(event);
      break;
    case 'conversation_start':
      handleConversationStart(event);
      break;
    case 'content':
      appendContent(event.content);
      break;
    case 'message':
      saveMessage(event.message);
      break;
    case 'done':
      completeStream(event);
      break;
    case 'error':
      handleError(event);
      break;
  }
}
```

---

## 当前问题与修复建议

### ✅ 问题 1：后端 metadata 类型混乱

**状态**：已修复

**修复内容**：`raw-requirement-collection.controller.ts` 中分离为独立事件类型：
- `analyze_start`: 分析开始元数据
- `conversation_start`: 会话开始元数据

### ✅ 问题 2：AI 服务转发未解包

**状态**：已修复

**修复内容**：后端转发时跳过 AI 服务的第一个 metadata 事件，只转发 `content`、`message`、`error` 类型事件。

### ✅ 问题 3：前端未实现 SSE 解析

**状态**：已修复

**修复内容**：`useAiSubmit` 添加 `submitStream` 方法和 SSE 事件类型定义，支持流式提交和解析。

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| `LLM_UNAVAILABLE` | LLM 服务不可用 |
| `CONVERSATION_NOT_FOUND` | 会话不存在 |
| `COLLECTION_NOT_FOUND` | 收集项不存在 |
| `INVALID_REQUEST` | 请求参数错误 |
| `UNAUTHORIZED` | 未授权 |
| `STREAM_ERROR` | 流式传输错误 |

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2024-01-01 | 初始版本 |
| 1.1.0 | 2026-04-21 | 分离 metadata 为 analyze_start/conversation_start；添加前端 SSE 解析支持 |
