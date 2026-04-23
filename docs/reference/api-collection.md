# 原始需求收集 API

## 端点总览

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/collections` | POST | 创建收集 |
| `/collections` | GET | 获取项目下的收集列表 |
| `/collections/:id` | GET | 获取收集详情 |
| `/collections/:id` | PUT | 更新收集 |
| `/collections/:id` | DELETE | 删除收集 |
| `/collections/:id/complete` | POST | 完成收集 |
| `/collections/:id/raw-requirements` | POST | 添加原始需求 |
| `/collections/:id/raw-requirements` | GET | 获取原始需求列表 |
| `/collections/:id/analyze` | POST | 需求分析（组合提示词） |
| `/collections/:id/analyze/stream` | SSE | 需求分析（SSE流） |
| `/collections/:id/chat` | POST | 在收集内对话 |
| `/collections/:id/stream` | SSE | 流式对话 |
| `/collections/raw-requirements/:id` | GET | 获取原始需求详情 |
| `/collections/raw-requirements/:id/chat` | POST | 原始需求对话 |
| `/collections/raw-requirements/:id/stream` | SSE | 流式对话 |
| `/collections/raw-requirements/:id` | DELETE | 删除原始需求 |

---

## 收集管理

### 创建收集

```http
POST /collections
Content-Type: application/json

{
  "projectId": "uuid",
  "title": "Q1 需求调研",
  "collectionType": "interview",
  "meetingMinutes": "会议纪要内容（可选）"
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "title": "Q1 需求调研",
    "collectionType": "interview",
    "status": "active",
    "rawRequirementCount": 0,
    "chatRoundCount": 0,
    "createdAt": "2026-04-20T10:00:00Z"
  }
}
```

### 获取收集列表

```http
GET /collections?projectId=uuid
```

**响应：**

```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "title": "Q1 需求调研",
      "collectionType": "interview",
      "status": "active",
      "rawRequirementCount": 5,
      "chatRoundCount": 12,
      "createdAt": "2026-04-20T10:00:00Z"
    }
  ]
}
```

### 获取收集详情

```http
GET /collections/:id
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "title": "Q1 需求调研",
    "collectionType": "interview",
    "status": "active",
    "collectedBy": {
      "id": "uuid",
      "displayName": "张三"
    },
    "rawRequirementCount": 5,
    "chatRoundCount": 12,
    "rawRequirements": [
      {
        "id": "uuid",
        "content": "需求内容...",
        "status": "pending",
        "questionAndAnswers": [],
        "keyElements": [],
        "createdAt": "2026-04-20T10:00:00Z"
      }
    ],
    "createdAt": "2026-04-20T10:00:00Z",
    "updatedAt": "2026-04-20T12:00:00Z"
  }
}
```

### 更新收集

```http
PUT /collections/:id
Content-Type: application/json

{
  "title": "更新后的标题",
  "meetingMinutes": "更新后的会议纪要"
}
```

### 删除收集

```http
DELETE /collections/:id
```

### 完成收集

```http
POST /collections/:id/complete
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "success": true,
    "message": "收集已完成"
  }
}
```

---

## 原始需求管理

### 添加原始需求

```http
POST /collections/:id/raw-requirements
Content-Type: application/json

{
  "content": "需求内容",
  "source": "用户访谈"
}
```

### 获取原始需求列表

```http
GET /collections/:id/raw-requirements
```

### 获取原始需求详情

```http
GET /collections/raw-requirements/:id
```

### 删除原始需求

```http
DELETE /collections/raw-requirements/:id
```

---

## 需求分析与对话

### 需求分析（组合提示词）

使用 `requirement.prompts.ts` 中的 `RAW_REQUIREMENT_ANALYSIS` 提示词模板进行分析。

```http
POST /collections/:id/analyze
Content-Type: application/json

{
  "rawRequirement": "原始需求内容",
  "projectContext": "项目背景（可选）",
  "previousQuestions": [
    { "question": "追问问题1", "answer": "用户回答1" },
    { "question": "追问问题2", "answer": "用户回答2" }
  ],
  "configId": "uuid"
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "systemPrompt": "你是一个专业的需求分析师...",
    "userPrompt": "原始需求：...\n项目背景：...\n之前的追问问题和回答：..."
  }
}
```

### 需求分析（SSE 流）

```http
POST /collections/:id/analyze/stream
Content-Type: application/json

{
  "rawRequirement": "原始需求内容",
  "projectContext": "项目背景（可选）",
  "previousQuestions": [],
  "configId": "uuid"
}
```

**SSE 事件：**

```json
// 元数据事件（包含组合后的提示词）
data: {"type": "metadata", "collectionId": "xxx", "prompts": {...}}

// 对话创建事件
data: {"type": "metadata", "conversationId": "xxx", "isNewConversation": true}

// AI 响应内容
data: {"type": "content", "content": "分析结果..."}

// 结束事件
data: {"type": "done"}
```

### 在收集内对话

```http
POST /collections/:id/chat
Content-Type: application/json

{
  "message": "用户消息",
  "configId": "uuid",
  "files": [
    {
      "type": "docx",
      "data": "base64编码内容",
      "name": "需求文档.docx"
    }
  ],
  "systemPrompt": "自定义系统提示（可选）"
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "rawRequirementId": "uuid",
    "conversationId": "uuid",
    "assistantMessage": "AI 回复内容",
    "followUpQuestions": ["追问问题1", "追问问题2"],
    "isComplete": false,
    "questionCount": 3
  }
}
```

### 流式对话

```http
POST /collections/:id/stream?message=用户消息&configId=uuid
```

**SSE 事件：**

```json
data: {"type": "metadata", "isNewConversation": true, "rawRequirementId": "xxx", "conversationId": "yyy"}
data: {"type": "content", "content": "AI 回复内容..."}
data: {"type": "metadata", "followUpQuestions": ["问题1?"]}
data: {"type": "done"}
```

### 原始需求对话

```http
POST /collections/raw-requirements/:id/chat
Content-Type: application/json

{
  "message": "用户消息",
  "configId": "uuid",
  "files": [],
  "systemPrompt": "自定义系统提示（可选）"
}
```

### 原始需求流式对话

```http
POST /collections/raw-requirements/:id/stream
Content-Type: application/json

{
  "message": "用户消息",
  "configId": "uuid"
}
```

---

## 数据模型

### CollectionType 枚举

```typescript
type CollectionType = 'interview' | 'workshop' | 'document' | 'other';
```

| 值 | 说明 |
|----|------|
| `interview` | 用户访谈 |
| `workshop` | 工作坊 |
| `document` | 文档收集 |
| `other` | 其他 |

### CollectionStatus 枚举

```typescript
type CollectionStatus = 'active' | 'completed';
```

| 值 | 说明 |
|----|------|
| `active` | 进行中 |
| `completed` | 已完成 |

### RawRequirementStatus 枚举

```typescript
type RawRequirementStatus = 'pending' | 'processing' | 'clarified' | 'archived';
```

| 值 | 说明 |
|----|------|
| `pending` | 待澄清 |
| `processing` | 澄清中 |
| `clarified` | 已澄清 |
| `archived` | 已归档 |
