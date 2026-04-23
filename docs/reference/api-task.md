# 任务管理 API

## 端点总览

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/tasks/:requirementId/tasks` | POST | 创建任务 |
| `/tasks/:requirementId/tasks` | GET | 获取需求下的任务 |
| `/tasks/:id` | GET | 获取任务详情 |
| `/tasks/:id` | PUT | 更新任务 |
| `/tasks/:id` | DELETE | 删除任务 |
| `/tasks/:id/status` | PUT | 更新任务状态 |
| `/tasks/:id/assign` | POST | 分配任务 |
| `/tasks/:id/dependencies` | POST | 添加任务依赖 |
| `/tasks/:id/dependencies` | GET | 获取任务依赖列表 |
| `/tasks/:id/dependencies/:depId` | DELETE | 移除任务依赖 |
| `/tasks/kanban/:projectId` | GET | 获取项目看板数据 |

---

## 任务管理

### 创建任务

```http
POST /tasks/:requirementId/tasks
Content-Type: application/json

{
  "title": "任务标题",
  "description": "任务描述",
  "priority": 1,                    // 1-10，1最高
  "estimatedHours": 8,
  "assignedTo": "uuid"             // 可选
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "title": "任务标题",
    "description": "任务描述",
    "priority": 1,
    "status": "todo",
    "estimatedHours": 8,
    "actualHours": 0,
    "assignedTo": {
      "id": "uuid",
      "displayName": "张三"
    },
    "createdAt": "2026-04-20T10:00:00Z"
  }
}
```

### 获取需求下的任务

```http
GET /tasks/:requirementId/tasks
```

### 获取任务详情

```http
GET /tasks/:id
```

### 更新任务

```http
PUT /tasks/:id
Content-Type: application/json

{
  "title": "更新后的标题",
  "description": "更新后的描述",
  "priority": 2,
  "estimatedHours": 16
}
```

### 删除任务

```http
DELETE /tasks/:id
```

---

## 任务状态与分配

### 更新任务状态

```http
PUT /tasks/:id/status
Content-Type: application/json

{
  "status": "in_progress",
  "actualHours": 4                  // 可选：实际工时
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "status": "in_progress",
    "actualHours": 4
  }
}
```

### 分配任务

```http
POST /tasks/:id/assign
Content-Type: application/json

{
  "userId": "uuid"
}
```

---

## 任务依赖管理

### 添加任务依赖

```http
POST /tasks/:id/dependencies
Content-Type: application/json

{
  "dependsOnId": "uuid",            // 依赖的任务ID
  "type": "blocks"                  // blocks | blocked_by
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "taskId": "uuid",
    "dependsOnId": "uuid",
    "type": "blocks",
    "createdAt": "2026-04-20T10:00:00Z"
  }
}
```

### 获取任务依赖列表

```http
GET /tasks/:id/dependencies
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "blocks": [
      {
        "id": "uuid",
        "task": {
          "id": "uuid",
          "title": "被阻塞的任务"
        }
      }
    ],
    "blockedBy": [
      {
        "id": "uuid",
        "task": {
          "id": "uuid",
          "title": "阻塞的任务"
        }
      }
    ]
  }
}
```

### 移除任务依赖

```http
DELETE /tasks/:id/dependencies/:depId
```

---

## 看板视图

### 获取项目看板数据

```http
GET /tasks/kanban/:projectId
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "columns": [
      {
        "status": "todo",
        "title": "待办",
        "tasks": [
          {
            "id": "uuid",
            "title": "任务1",
            "priority": 1,
            "assignedTo": { "displayName": "张三" },
            "estimatedHours": 8
          }
        ]
      },
      {
        "status": "in_progress",
        "title": "进行中",
        "tasks": []
      },
      {
        "status": "done",
        "title": "已完成",
        "tasks": []
      }
    ],
    "summary": {
      "totalTasks": 10,
      "completedTasks": 3,
      "totalEstimatedHours": 80,
      "totalActualHours": 24
    }
  }
}
```

---

## 数据模型

### TaskStatus 枚举

```typescript
type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
```

| 值 | 说明 |
|----|------|
| `todo` | 待办 |
| `in_progress` | 进行中 |
| `done` | 已完成 |
| `cancelled` | 已取消 |

### TaskPriority 枚举

```typescript
type TaskPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
```

数值越小优先级越高。

### DependencyType 枚举

```typescript
type DependencyType = 'blocks' | 'blocked_by';
```

| 值 | 说明 |
|----|------|
| `blocks` | 阻塞（当前任务完成后，被依赖任务才能开始） |
| `blocked_by` | 被阻塞（当前任务依赖的任务完成后才能开始） |
