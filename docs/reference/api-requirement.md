# 需求 API

需求管理接口，支持需求 CRUD、状态流转、变更历史和 AI 生成。

---

## 端点总览

### 需求管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/requirements` | POST | 创建需求 |
| `/requirements` | GET | 获取需求列表（需配合查询参数） |
| `/requirements/:id` | GET | 获取需求详情 |
| `/requirements/:id` | PUT | 更新需求 |
| `/requirements/:id` | DELETE | 删除需求 |
| `/requirements/batch` | POST | 批量创建需求 |

### 按关联查询

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/requirements/modules/:moduleId/requirements` | GET | 获取模块下的需求 |
| `/requirements/projects/:projectId/requirements` | GET | 获取项目下的需求 |
| `/requirements/raw-requirement/:rawRequirementId/requirements` | GET | 获取原始需求关联的需求 |

### 状态管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/requirements/:id/transition` | POST | 状态流转 |
| `/requirements/:id/allowed-transitions` | GET | 获取允许的状态流转 |
| `/requirements/:id/review` | POST | 评审需求 |
| `/requirements/:id/change-history` | GET | 获取变更历史 |

### AI 生成

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/requirements/generate/stream` | POST | 流式生成需求（SSE） |

---

## 需求管理

### 创建需求

```http
POST /requirements
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "需求标题",
  "description": "需求描述",
  "type": "功能需求",
  "priority": "高",
  "moduleId": "uuid",
  "sourceRawRequirementId": "uuid"
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "title": "需求标题",
    "description": "需求描述",
    "type": "功能需求",
    "priority": "高",
    "status": "draft",
    "createdAt": "2026-04-20T10:00:00Z"
  }
}
```

### 批量创建需求

```http
POST /requirements/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "requirements": [
    {
      "title": "需求1",
      "description": "描述1",
      "sourceRawRequirementId": "uuid"
    },
    {
      "title": "需求2",
      "description": "描述2",
      "sourceRawRequirementId": "uuid"
    }
  ]
}
```

### 获取需求详情

```http
GET /requirements/:id
Authorization: Bearer <token>
```

### 更新需求

```http
PUT /requirements/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "新标题",
  "description": "新描述",
  "priority": "中"
}
```

### 删除需求

```http
DELETE /requirements/:id
Authorization: Bearer <token>
```

---

## 按关联查询

### 获取模块下的需求

```http
GET /requirements/modules/:moduleId/requirements?page=1&limit=20
Authorization: Bearer <token>
```

### 获取项目下的需求

```http
GET /requirements/projects/:projectId/requirements?page=1&limit=20
Authorization: Bearer <token>
```

### 获取原始需求关联的需求

```http
GET /requirements/raw-requirement/:rawRequirementId/requirements
Authorization: Bearer <token>
```

---

## 状态管理

### 状态流转

```http
POST /requirements/:id/transition
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetStatus": "in_review",
  "comment": "提交评审"
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "status": "in_review",
    "updatedAt": "2026-04-20T12:00:00Z"
  }
}
```

### 获取允许的状态流转

```http
GET /requirements/:id/allowed-transitions
Authorization: Bearer <token>
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "allowedTransitions": ["in_review", "cancelled"]
  }
}
```

### 评审需求

```http
POST /requirements/:id/review
Authorization: Bearer <token>
Content-Type: application/json

{
  "approved": true,
  "comment": "评审通过"
}
```

### 获取变更历史

```http
GET /requirements/:id/change-history
Authorization: Bearer <token>
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "requirementId": "uuid",
        "changeType": "status",
        "oldValue": "draft",
        "newValue": "in_review",
        "comment": "提交评审",
        "changedBy": {
          "id": "uuid",
          "displayName": "用户1",
          "username": "user1"
        },
        "createdAt": "2026-04-20T12:00:00Z"
      }
    ],
    "total": 5
  }
}
```

---

## AI 生成

### 流式生成需求

根据原始需求内容流式生成结构化需求。

```http
POST /requirements/generate/stream
Authorization: Bearer <token>
Content-Type: application/json

{
  "rawRequirementId": "uuid"
}
```

**SSE 响应：**

```
data: {"type": "content", "content": "需求分析中..."}

data: {"type": "content", "content": "1. 需求标题: ..."}

data: {"type": "requirements", "requirements": [{"title": "...", "description": "..."}]}

data: {"type": "done"}

data: [DONE]
```

---

## 数据模型

### 需求状态

| 状态 | 说明 |
|------|------|
| `draft` | 草稿 |
| `in_review` | 评审中 |
| `approved` | 已批准 |
| `rejected` | 已拒绝 |
| `implemented` | 已实现 |
| `verified` | 已验证 |
| `cancelled` | 已取消 |

### 需求类型

| 类型 | 说明 |
|------|------|
| `功能需求` | 功能性需求 |
| `性能需求` | 性能相关需求 |
| `安全需求` | 安全性需求 |
| `接口需求` | 接口相关需求 |
| `数据需求` | 数据相关需求 |
| `其他` | 其他类型 |

### 优先级

| 优先级 | 说明 |
|--------|------|
| `高` | 高优先级 |
| `中` | 中优先级 |
| `低` | 低优先级 |
