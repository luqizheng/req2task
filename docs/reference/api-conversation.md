# 对话 API

AI Chat 服务提供的对话管理接口，支持多轮对话、消息管理和流式响应。

**基础路径**: `/api/ai`

---

## 端点总览

### 对话管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/conversations` | POST | 创建对话 |
| `/conversations/start` | POST | 创建并启动流式对话（SSE） |
| `/conversations` | GET | 获取对话列表 |
| `/conversations/:id` | GET | 获取对话详情 |
| `/conversations/:id` | DELETE | 删除对话 |
| `/conversations/:id/archive` | POST | 归档对话 |

### 消息交互

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/conversations/:id/messages` | GET | 获取消息列表 |
| `/conversations/:id/messages` | POST | 发送消息（非流式） |
| `/conversations/:id/messages/stream` | POST | 流式发送消息（SSE） |

### LLM 通用接口

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/generate` | POST | 通用文本生成 |
| `/generate/stream` | POST | 流式文本生成（SSE） |

### 文本处理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/text/process` | POST | 文本处理（转录、摘要、提取、翻译） |

---

## 对话管理

### 创建对话

```http
POST /api/ai/conversations
Content-Type: application/json

{
  "title": "对话标题",
  "systemPrompt": "你是一个专业的需求分析师..."
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid"
  }
}
```

### 创建并启动流式对话

创建新对话并立即发送消息，通过 SSE 流式返回 AI 响应。

```http
POST /api/ai/conversations/start
Content-Type: application/json

{
  "title": "对话标题",
  "systemPrompt": "你是一个...",
  "content": "用户消息内容",
  "files": [
    {
      "type": "docx",
      "data": "base64编码内容",
      "name": "文档.docx"
    }
  ]
}
```

**SSE 响应：**

```
data: {"type": "conversation_start", "conversationId": "uuid", "isNewConversation": true}

data: {"type": "content", "content": "部分内容..."}
data: {"type": "content", "content": "继续内容..."}

data: {"type": "message", "message": {"id": "uuid", "role": "assistant", "content": "完整回复", ...}}

data: {"type": "done"}

data: [DONE]
```

### 获取对话列表

```http
GET /api/ai/conversations?limit=100&offset=0
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "conversations": [
      {
        "id": "uuid",
        "title": "对话标题",
        "status": "active",
        "messageCount": 10,
        "createdAt": "2026-04-20T10:00:00Z",
        "updatedAt": "2026-04-20T12:00:00Z"
      }
    ],
    "total": 50
  }
}
```

### 获取对话详情

```http
GET /api/ai/conversations/:id
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "title": "对话标题",
    "status": "active",
    "messageCount": 10,
    "messages": [
      {
        "id": "uuid",
        "role": "user",
        "content": "用户消息",
        "createdAt": "2026-04-20T10:00:00Z"
      },
      {
        "id": "uuid",
        "role": "assistant",
        "content": "AI 回复",
        "createdAt": "2026-04-20T10:00:01Z"
      }
    ],
    "createdAt": "2026-04-20T10:00:00Z",
    "updatedAt": "2026-04-20T12:00:00Z"
  }
}
```

### 删除对话

```http
DELETE /api/ai/conversations/:id
```

**响应：** 204 No Content

### 归档对话

```http
POST /api/ai/conversations/:id/archive
```

**响应：**

```json
{
  "code": 0,
  "message": "Conversation archived"
}
```

---

## 消息交互

### 获取消息列表

```http
GET /api/ai/conversations/:id/messages?limit=100&offset=0
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "messages": [
      {
        "id": "uuid",
        "role": "user",
        "content": "用户消息",
        "createdAt": "2026-04-20T10:00:00Z"
      }
    ],
    "total": 10
  }
}
```

### 发送消息（非流式）

```http
POST /api/ai/conversations/:id/messages
Content-Type: application/json

{
  "content": "用户消息内容",
  "files": [
    {
      "type": "docx",
      "data": "base64编码内容",
      "name": "文档.docx"
    }
  ]
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "message": {
      "id": "uuid",
      "conversationId": "uuid",
      "role": "assistant",
      "content": "AI 回复内容",
      "createdAt": "2026-04-20T10:00:00Z"
    }
  }
}
```

### 流式发送消息

```http
POST /api/ai/conversations/:id/messages/stream
Content-Type: application/json

{
  "content": "用户消息内容",
  "files": []
}
```

**SSE 响应：**

```
data: {"type": "conversation_start", "conversationId": "uuid", "isNewConversation": false}

data: {"type": "content", "content": "部分内容..."}

data: {"type": "message", "message": {"id": "uuid", "role": "assistant", "content": "..."}}

data: {"type": "done"}

data: [DONE]
```

---

## LLM 通用接口

### 通用文本生成

```http
POST /api/ai/generate
Content-Type: application/json

{
  "systemPrompt": "系统提示词",
  "userPrompt": "用户提示词",
  "temperature": 0.7,
  "maxTokens": 2000,
  "conversationId": "uuid"
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "content": "生成的文本内容",
    "conversationId": "uuid"
  }
}
```

### 流式文本生成

```http
POST /api/ai/generate/stream
Content-Type: application/json

{
  "systemPrompt": "系统提示词",
  "userPrompt": "用户提示词",
  "temperature": 0.7,
  "maxTokens": 2000,
  "conversationId": "uuid"
}
```

**SSE 响应：**

```
data: {"type": "metadata", "conversationId": "uuid"}

data: {"type": "content", "content": "部分内容..."}

data: {"type": "message", "message": {...}}

data: {"type": "done"}

data: [DONE]
```

---

## 文本处理

### 处理文本

```http
POST /api/ai/text/process
Content-Type: application/json

{
  "text": "需要处理的文本内容",
  "task": "summarize"
}
```

**任务类型：**

| 类型 | 说明 |
|------|------|
| `transcription` | 转录文本清理和格式化 |
| `summarize` | 文本摘要 |
| `extract` | 关键信息提取 |
| `translate` | 文本翻译 |

**响应：**

```json
{
  "code": 0,
  "data": {
    "result": "处理后的文本",
    "task": "summarize"
  }
}
```

---

## 数据模型

### MessageRole 枚举

```typescript
type MessageRole = 'user' | 'assistant' | 'system';
```

### 文件附件类型

```typescript
interface FileAttachment {
  type: 'text' | 'docx' | 'pdf' | 'audio';
  data: string;  // base64 编码或文本内容
  name: string;  // 文件名
}
```

### SSE 事件类型

| 类型 | 说明 |
|------|------|
| `conversation_start` | 对话开始事件 |
| `metadata` | 元数据事件 |
| `content` | 内容片段事件 |
| `message` | 完整消息事件 |
| `done` | 完成事件 |
| `error` | 错误事件 |
| `[DONE]` | 流结束标记 |
