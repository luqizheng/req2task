# 原始需求 API

原始需求管理接口，支持原始需求 CRUD、AI 流式生成和标题生成。

---

## 端点总览

### 原始需求管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/raw-requirements/:projectId` | POST | 创建原始需求 |
| `/raw-requirements/:rawRequirementId` | GET | 获取原始需求详情 |
| `/raw-requirements/:rawRequirementId` | PUT | 更新原始需求 |
| `/raw-requirements/:rawRequirementId` | DELETE | 删除原始需求 |
| `/raw-requirements/:projectId/raw-requirements` | GET | 获取项目下的原始需求 |

### AI 生成

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/raw-requirements/:projectId/stream` | POST | 流式生成原始需求（SSE） |
| `/raw-requirements/generate-title` | POST | 生成标题 |

---

## 原始需求管理

### 创建原始需求

```http
POST /raw-requirements/:projectId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "原始需求标题",
  "content": "原始需求内容",
  "source": "manual"
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "title": "原始需求标题",
    "content": "原始需求内容",
    "source": "manual",
    "projectId": "uuid",
    "createdAt": "2026-04-20T10:00:00Z"
  },
  "message": "创建成功"
}
```

### 获取原始需求详情

```http
GET /raw-requirements/:rawRequirementId
Authorization: Bearer <token>
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "title": "原始需求标题",
    "content": "原始需求内容",
    "source": "manual",
    "projectId": "uuid",
    "questionAndAnswers": [],
    "createdAt": "2026-04-20T10:00:00Z"
  }
}
```

### 更新原始需求

```http
PUT /raw-requirements/:rawRequirementId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "新标题",
  "content": "新内容"
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "title": "新标题",
    "content": "新内容"
  },
  "message": "更新成功"
}
```

### 删除原始需求

```http
DELETE /raw-requirements/:rawRequirementId
Authorization: Bearer <token>
```

**响应：**

```json
{
  "code": 0,
  "message": "删除成功"
}
```

### 获取项目下的原始需求

```http
GET /raw-requirements/:projectId/raw-requirements?page=1&limit=20
Authorization: Bearer <token>
```

**响应：**

```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "title": "原始需求标题",
      "content": "原始需求内容",
      "source": "manual",
      "createdAt": "2026-04-20T10:00:00Z"
    }
  ]
}
```

---

## AI 生成

### 流式生成原始需求

通过对话方式流式生成结构化原始需求。

```http
POST /raw-requirements/:projectId/stream
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversationText": "用户输入的对话内容",
  "previousQuestions": ["之前的追问1", "之前的追问2"]
}
```

**SSE 响应：**

```
data: {"type": "content", "content": "正在分析需求..."}

data: {"type": "content", "content": "追问：您能否详细描述一下..."}

data: {"type": "question", "question": "您能否详细描述一下功能的具体场景？"}

data: {"type": "raw_requirement", "rawRequirement": {"title": "...", "content": "..."}}

data: {"type": "done"}

data: [DONE]
```

### 生成标题

根据原始需求内容自动生成标题。

```http
POST /raw-requirements/generate-title
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "原始需求内容"
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "title": "生成的标题"
  }
}
```

---

## 数据模型

### 原始需求来源

| 来源 | 说明 |
|------|------|
| `manual` | 手动创建 |
| `ai_generated` | AI 生成 |
| `imported` | 导入 |
