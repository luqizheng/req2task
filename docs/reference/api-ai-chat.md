# AI Chat 对话 API

AI Chat 服务提供统一的对话管理能力，支持多轮对话、文件附件、流式响应。

## 端点总览

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/ai/chat/conversations` | POST | 创建对话 |
| `/ai/chat/conversations/:id` | GET | 获取对话详情 |
| `/ai/chat/conversations/:id/messages` | GET | 获取消息列表 |
| `/ai/chat/conversations/:id/messages` | POST | 发送消息 |
| `/ai/chat/conversations/:id/stream` | SSE | 流式发送消息 |
| `/ai/chat/conversations/:id` | DELETE | 清空对话 |

---

## 对话管理

### 创建对话

```http
POST /ai/chat/conversations
Content-Type: application/json

{
  "collectionId": "uuid",           // 可选：需求收集ID
  "rawRequirementId": "uuid",       // 可选：原始需求ID
  "title": "对话标题",             // 可选
  "systemPrompt": "你是一个..."    // 可选：自定义系统提示
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

### 获取对话详情

```http
GET /ai/chat/conversations/:id
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

### 获取消息列表

```http
GET /ai/chat/conversations/:id/messages?limit=100&offset=0
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

### 清空对话

```http
DELETE /ai/chat/conversations/:id
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "deleted": true
  }
}
```

---

## 消息交互

### 发送消息

```http
POST /ai/chat/conversations/:id/messages
Content-Type: application/json

{
  "content": "用户消息内容",
  "files": [                        // 可选：附件
    {
      "type": "docx",              // text | docx | pdf | audio
      "data": "base64编码或文本",
      "name": "文件名.docx"
    }
  ],
  "configId": "uuid"                // 可选：LLM配置ID
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "conversationId": "uuid",
    "role": "assistant",
    "content": "AI 回复内容",
    "createdAt": "2026-04-20T10:00:00Z",
    "metadata": {
      "followUpQuestions": ["追问问题1?", "追问问题2?"],
      "keyElements": ["关键要素1", "关键要素2"]
    }
  }
}
```

### 流式发送消息

```http
POST /ai/chat/conversations/:id/stream?content=用户消息&configId=uuid
Content-Type: application/json

{
  "files": [],                      // 可选
  "configId": "uuid"                // 可选
}
```

**SSE 事件：**

```json
// 内容片段
data: {"type": "content", "content": "部分内容..."}
data: {"type": "content", "content": "继续内容..."}

// 完成事件（包含元数据）
data: {"type": "metadata", "followUpQuestions": ["问题1?"], "keyElements": []}

// 错误事件
data: {"type": "error", "error": "错误信息"}

// 结束标记
data: [DONE]
```

---

## 文件附件

### 支持的文件类型

| 类型 | 说明 | 处理方式 |
|------|------|----------|
| `text` | 纯文本 | 直接作为内容发送 |
| `docx` | Word 文档 | 提取文本内容发送 |
| `pdf` | PDF 文档 | 提取文本内容发送 |
| `audio` | 音频文件 | 需要配置 Whisper 进行转录 |

### 文件上传示例

```http
POST /ai/chat/conversations/:id/messages
Content-Type: application/json

{
  "content": "请分析这个需求文档",
  "files": [
    {
      "type": "docx",
      "data": "base64编码的docx文件内容",
      "name": "需求文档.docx"
    }
  ]
}
```

---

## 数据模型

### MessageRole 枚举

```typescript
type MessageRole = 'user' | 'assistant' | 'system';
```

| 值 | 说明 |
|----|------|
| `user` | 用户消息 |
| `assistant` | AI 回复 |
| `system` | 系统消息 |

### StreamChunk 类型

```typescript
interface StreamChunk {
  type: 'content' | 'metadata' | 'done' | 'error';
  content?: string;
  conversationId?: string;
  messageId?: string;
  followUpQuestions?: string[];
  keyElements?: string[];
  isComplete?: boolean;
  error?: string;
}
```

### SendMessageResponse 类型

```typescript
interface SendMessageResponse {
  id: string;
  conversationId: string;
  role: 'assistant';
  content: string;
  createdAt: string;
  metadata?: {
    followUpQuestions?: string[];
    keyElements?: string[];
  };
}
```

---

## 与 Collection API 的关系

AI Chat API 提供底层对话能力，而 [Collection API](api-collection.md) 在其基础上封装了业务逻辑：

```
前端 → Collection API (/collections/:id/analyze/stream)
            ↓
    组合提示词（使用 RAW_REQUIREMENT_ANALYSIS 模板）
            ↓
    调用 AI Chat API (/ai/chat/conversations)
            ↓
    返回流式响应
```

**选择建议：**
- **使用 Collection API**：在需求收集场景下，自动处理提示词组合和业务逻辑
- **使用 AI Chat API**：需要自定义对话逻辑或管理独立的对话会话
