# 会话管理 API

通用会话管理，用于追踪与外部系统或用户的对话交互。

## 端点总览

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/conversations` | POST | 创建会话 |
| `/conversations` | GET | 获取会话列表 |
| `/conversations/:id` | GET | 获取会话详情 |
| `/conversations/:id` | PATCH | 更新会话 |
| `/conversations/:id` | DELETE | 删除会话 |
| `/conversations/:id/messages` | POST | 发送消息 |
| `/conversations/:id/messages` | GET | 获取会话消息 |

---

## 会话管理

### 创建会话

```http
POST /conversations
Content-Type: application/json

{
  "projectId": "uuid",
  "title": "会话标题",
  "conversationType": "external",  // external | internal
  "metadata": {
    "source": "email",
    "participants": ["user1", "user2"]
  }
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "title": "会话标题",
    "conversationType": "external",
    "status": "active",
    "messageCount": 0,
    "metadata": {},
    "createdAt": "2026-04-20T10:00:00Z",
    "updatedAt": "2026-04-20T10:00:00Z"
  }
}
```

### 获取会话列表

```http
GET /conversations?projectId=uuid&status=active&limit=20&offset=0
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "会话标题",
        "status": "active",
        "messageCount": 5,
        "updatedAt": "2026-04-20T12:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

### 获取会话详情

```http
GET /conversations/:id
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "title": "会话标题",
    "conversationType": "external",
    "status": "active",
    "messageCount": 5,
    "summary": "会话摘要（可选）",
    "metadata": {
      "source": "email"
    },
    "createdAt": "2026-04-20T10:00:00Z",
    "updatedAt": "2026-04-20T12:00:00Z"
  }
}
```

### 更新会话

```http
PATCH /conversations/:id
Content-Type: application/json

{
  "title": "更新后的标题",
  "status": "completed",
  "summary": "会话摘要"
}
```

### 删除会话

```http
DELETE /conversations/:id
```

---

## 消息管理

### 发送消息

```http
POST /conversations/:id/messages
Content-Type: application/json

{
  "content": "消息内容",
  "senderId": "uuid",
  "senderType": "user",            // user | system | bot
  "metadata": {
    "channel": "email"
  }
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "conversationId": "uuid",
    "content": "消息内容",
    "senderId": "uuid",
    "senderType": "user",
    "createdAt": "2026-04-20T10:00:00Z"
  }
}
```

### 获取会话消息

```http
GET /conversations/:id/messages?limit=50&offset=0
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": "uuid",
        "content": "消息内容",
        "senderId": "uuid",
        "senderType": "user",
        "createdAt": "2026-04-20T10:00:00Z"
      }
    ],
    "total": 10
  }
}
```

---

## 数据模型

### ConversationStatus 枚举

```typescript
type ConversationStatus = 'active' | 'completed' | 'archived';
```

| 值 | 说明 |
|----|------|
| `active` | 进行中 |
| `completed` | 已完成 |
| `archived` | 已归档 |

### ConversationType 枚举

```typescript
type ConversationType = 'external' | 'internal';
```

| 值 | 说明 |
|----|------|
| `external` | 外部会话（与用户、外部系统的对话） |
| `internal` | 内部会话（团队内部讨论） |

### MessageSenderType 枚举

```typescript
type MessageSenderType = 'user' | 'system' | 'bot';
```

| 值 | 说明 |
|----|------|
| `user` | 用户 |
| `system` | 系统 |
| `bot` | 机器人 |

### Conversation 类型

```typescript
interface Conversation {
  id: string;
  projectId: string;
  title: string;
  conversationType: ConversationType;
  status: ConversationStatus;
  messageCount: number;
  summary?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### ConversationMessage 类型

```typescript
interface ConversationMessage {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  senderType: MessageSenderType;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
```
