# 任务 API

任务管理接口，支持任务 CRUD、看板视图、依赖管理和 AI 生成。

---

## 端点总览

### 任务管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/requirements/:requirementId/tasks` | POST | 创建任务 |
| `/requirements/:requirementId/tasks` | GET | 获取需求下的任务 |
| `/tasks/:id` | GET | 获取任务详情 |
| `/tasks/:id` | PUT | 更新任务 |
| `/tasks/:id` | DELETE | 删除任务 |

### 按关联查询

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/modules/:moduleId/tasks` | GET | 获取模块下的任务 |
| `/projects/:projectId/tasks` | GET | 获取项目下的任务 |

### 看板管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/requirements/:requirementId/kanban` | GET | 获取需求看板 |
| `/requirements/:requirementId/task-statistics` | GET | 获取需求任务统计 |
| `/projects/:projectId/kanban` | GET | 获取项目看板 |
| `/projects/:projectId/task-statistics` | GET | 获取项目任务统计 |

### 状态管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/tasks/:id/transition` | POST | 状态流转 |
| `/tasks/:id/allowed-transitions` | GET | 获取允许的状态流转 |

### 依赖管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/tasks/:id/dependencies` | POST | 添加依赖 |
| `/tasks/:id/dependencies/:dependencyTaskId` | DELETE | 移除依赖 |

### 任务替换/取消

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/tasks/:id/mark-replaced` | POST | 标记为已替换 |
| `/tasks/:id/mark-cancelled` | POST | 标记为已取消 |
| `/tasks/:id/replaced-tasks` | GET | 获取替换任务 |

### 工作量统计

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/projects/:projectId/workload-stats` | GET | 获取项目工作量统计 |

### AI 生成

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/llm/generation/tasks/:requirementId` | POST | AI 生成任务 |

---

## 任务管理

### 创建任务

```http
POST /requirements/:requirementId/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "任务标题",
  "description": "任务描述",
  "priority": 1,
  "estimatedHours": 8,
  "moduleId": "uuid"
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "taskNo": "TASK-001",
    "title": "任务标题",
    "description": "任务描述",
    "status": "todo",
    "priority": 1,
    "estimatedHours": 8,
    "requirementId": "uuid",
    "createdAt": "2026-04-20T10:00:00Z"
  }
}
```

### 获取任务详情

```http
GET /tasks/:id
Authorization: Bearer <token>
```

### 更新任务

```http
PUT /tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "新标题",
  "description": "新描述",
  "estimatedHours": 16
}
```

### 删除任务

```http
DELETE /tasks/:id
Authorization: Bearer <token>
```

---

## 按关联查询

### 获取需求下的任务

```http
GET /requirements/:requirementId/tasks?page=1&limit=20
Authorization: Bearer <token>
```

### 获取模块下的任务

```http
GET /modules/:moduleId/tasks?page=1&limit=20
Authorization: Bearer <token>
```

### 获取项目下的任务

```http
GET /projects/:projectId/tasks?page=1&limit=20
Authorization: Bearer <token>
```

---

## 看板管理

### 获取需求看板

```http
GET /requirements/:requirementId/kanban
Authorization: Bearer <token>
```

### 获取需求任务统计

```http
GET /requirements/:requirementId/task-statistics
Authorization: Bearer <token>
```

### 获取项目看板

```http
GET /projects/:projectId/kanban
Authorization: Bearer <token>
```

### 获取项目任务统计

```http
GET /projects/:projectId/task-statistics
Authorization: Bearer <token>
```

---

## 状态管理

### 状态流转

```http
POST /tasks/:id/transition
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetStatus": "in_progress"
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "status": "in_progress"
  }
}
```

### 获取允许的状态流转

```http
GET /tasks/:id/allowed-transitions
Authorization: Bearer <token>
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "allowedTransitions": ["in_progress", "cancelled"]
  }
}
```

---

## 依赖管理

### 添加依赖

```http
POST /tasks/:id/dependencies
Authorization: Bearer <token>
Content-Type: application/json

{
  "dependencyTaskId": "uuid"
}
```

### 移除依赖

```http
DELETE /tasks/:id/dependencies/:dependencyTaskId
Authorization: Bearer <token>
```

---

## 任务替换/取消

### 标记为已替换

```http
POST /tasks/:id/mark-replaced
Authorization: Bearer <token>
Content-Type: application/json

{
  "replacedByTaskId": "uuid",
  "reason": "需求变更"
}
```

### 标记为已取消

```http
POST /tasks/:id/mark-cancelled
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "需求取消"
}
```

### 获取替换任务

```http
GET /tasks/:id/replaced-tasks
Authorization: Bearer <token>
```

---

## 工作量统计

### 获取项目工作量统计

```http
GET /projects/:projectId/workload-stats
Authorization: Bearer <token>
```

---

## AI 生成

### AI 生成任务

根据需求功能点 AI 生成任务列表。

```http
POST /llm/generation/tasks/:requirementId
Authorization: Bearer <token>
Content-Type: application/json

{
  "featurePoints": ["功能点1", "功能点2"],
  "context": "额外上下文"
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "taskNo": "TASK-001",
        "title": "任务标题",
        "description": "任务描述",
        "status": "todo",
        "priority": 1,
        "estimatedHours": 8
      }
    ],
    "rawContent": "AI 生成的原始内容"
  }
}
```

---

## 数据模型

### 任务状态

| 状态 | 说明 |
|------|------|
| `todo` | 待办 |
| `in_progress` | 进行中 |
| `done` | 已完成 |
| `cancelled` | 已取消 |
| `replaced` | 已替换 |

### 优先级

| 优先级 | 说明 |
|--------|------|
| `1` | 最高 |
| `2` | 高 |
| `3` | 中 |
| `4` | 低 |
| `5` | 最低 |
