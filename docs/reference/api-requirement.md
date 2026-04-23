# 需求管理 API

## 端点总览

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/modules/:projectId/modules` | POST | 创建功能模块 |
| `/modules/:projectId/modules` | GET | 获取功能模块列表 |
| `/modules/:id` | GET | 获取功能模块详情 |
| `/modules/:id` | PUT | 更新功能模块 |
| `/modules/:id` | DELETE | 删除功能模块 |
| `/requirements/modules/:moduleId/requirements` | POST | 创建需求 |
| `/requirements/modules/:moduleId/requirements` | GET | 获取需求列表 |
| `/requirements/:id` | GET | 获取需求详情 |
| `/requirements/:id` | PUT | 更新需求 |
| `/requirements/:id` | DELETE | 删除需求 |
| `/requirements/:id/approve` | POST | 审批需求 |
| `/requirements/:id/changes` | GET | 获取需求变更历史 |
| `/requirements/:id/versions` | GET | 获取需求版本列表 |
| `/requirements/:id/versions/:version` | GET | 获取特定版本内容 |
| `/requirements/:id/versions/:version/restore` | POST | 恢复到指定版本 |
| `/user-stories/:requirementId/user-stories` | POST | 创建用户故事 |
| `/user-stories/:requirementId/user-stories` | GET | 获取用户故事列表 |
| `/user-stories/:id` | GET | 获取用户故事详情 |
| `/user-stories/:id` | PUT | 更新用户故事 |
| `/user-stories/:id` | DELETE | 删除用户故事 |
| `/acceptance-criteria/:userStoryId/acceptance-criteria` | POST | 创建验收条件 |
| `/acceptance-criteria/:userStoryId/acceptance-criteria` | GET | 获取验收条件列表 |
| `/acceptance-criteria/:id` | PUT | 更新验收条件 |
| `/acceptance-criteria/:id` | DELETE | 删除验收条件 |

---

## 功能模块管理

### 创建功能模块

```http
POST /modules/:projectId/modules
Content-Type: application/json

{
  "name": "模块名称",
  "description": "模块描述",
  "parentId": "uuid"               // 可选：父模块ID
}
```

### 获取功能模块列表

```http
GET /modules/:projectId/modules
```

### 获取功能模块详情

```http
GET /modules/:id
```

### 更新功能模块

```http
PUT /modules/:id
Content-Type: application/json

{
  "name": "更新后的名称",
  "description": "更新后的描述"
}
```

### 删除功能模块

```http
DELETE /modules/:id
```

---

## 需求管理

### 创建需求

```http
POST /requirements/modules/:moduleId/requirements
Content-Type: application/json

{
  "title": "需求标题",
  "description": "需求描述",
  "priority": "high",               // high | medium | low
  "type": "feature"                // feature | performance | security | interface
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
    "priority": "high",
    "type": "feature",
    "status": "draft",
    "version": 1,
    "createdAt": "2026-04-20T10:00:00Z"
  }
}
```

### 获取需求列表

```http
GET /requirements/modules/:moduleId/requirements
```

### 获取需求详情

```http
GET /requirements/:id
```

### 更新需求

```http
PUT /requirements/:id
Content-Type: application/json

{
  "title": "更新后的标题",
  "description": "更新后的描述",
  "priority": "medium"
}
```

### 删除需求

```http
DELETE /requirements/:id
```

### 审批需求

```http
POST /requirements/:id/approve
Content-Type: application/json

{
  "approved": true,
  "comment": "审批意见（可选）"
}
```

---

## 需求版本管理

### 获取需求变更历史

```http
GET /requirements/:id/changes
```

**响应：**

```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "field": "description",
      "oldValue": "旧值",
      "newValue": "新值",
      "changedBy": "张三",
      "changedAt": "2026-04-20T10:00:00Z"
    }
  ]
}
```

### 获取需求版本列表

```http
GET /requirements/:id/versions
```

### 获取特定版本内容

```http
GET /requirements/:id/versions/:version
```

### 恢复到指定版本

```http
POST /requirements/:id/versions/:version/restore
```

---

## 用户故事管理

### 创建用户故事

```http
POST /user-stories/:requirementId/user-stories
Content-Type: application/json

{
  "title": "用户故事标题",
  "asA": "作为产品经理",
  "iWant": "我想要...",
  "soThat": "以便..."
}
```

### 获取用户故事列表

```http
GET /user-stories/:requirementId/user-stories
```

### 获取用户故事详情

```http
GET /user-stories/:id
```

### 更新用户故事

```http
PUT /user-stories/:id
Content-Type: application/json

{
  "title": "更新后的标题",
  "asA": "作为...",
  "iWant": "我想要...",
  "soThat": "以便..."
}
```

### 删除用户故事

```http
DELETE /user-stories/:id
```

---

## 验收条件管理

### 创建验收条件

```http
POST /acceptance-criteria/:userStoryId/acceptance-criteria
Content-Type: application/json

{
  "content": "验收条件内容",
  "priority": 1,
  "status": "pending"              // pending | passed | failed
}
```

### 获取验收条件列表

```http
GET /acceptance-criteria/:userStoryId/acceptance-criteria
```

### 更新验收条件

```http
PUT /acceptance-criteria/:id
Content-Type: application/json

{
  "content": "更新后的内容",
  "status": "passed"
}
```

### 删除验收条件

```http
DELETE /acceptance-criteria/:id
```

---

## 数据模型

### RequirementStatus 枚举

```typescript
type RequirementStatus = 'draft' | 'pending' | 'approved' | 'implemented' | 'archived';
```

| 值 | 说明 |
|----|------|
| `draft` | 草稿 |
| `pending` | 待审批 |
| `approved` | 已审批 |
| `implemented` | 已实现 |
| `archived` | 已归档 |

### RequirementPriority 枚举

```typescript
type RequirementPriority = 'high' | 'medium' | 'low';
```

### RequirementType 枚举

```typescript
type RequirementType = 'feature' | 'performance' | 'security' | 'interface' | 'data' | 'ux';
```

| 值 | 说明 |
|----|------|
| `feature` | 功能需求 |
| `performance` | 性能需求 |
| `security` | 安全需求 |
| `interface` | 接口需求 |
| `data` | 数据需求 |
| `ux` | 用户体验需求 |

### UserStoryStatus 枚举

```typescript
type UserStoryStatus = 'pending' | 'in_progress' | 'completed';
```

### AcceptanceCriteriaStatus 枚举

```typescript
type AcceptanceCriteriaStatus = 'pending' | 'passed' | 'failed';
```
