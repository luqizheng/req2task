# 项目 API

项目管理接口，支持项目 CRUD、成员管理、进度追踪和基线管理。

---

## 端点总览

### 项目管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/projects` | GET | 获取项目列表 |
| `/projects` | POST | 创建项目 |
| `/projects/:id` | GET | 获取项目详情 |
| `/projects/key/:projectKey` | GET | 根据项目标识获取项目 |
| `/projects/:id` | PUT | 更新项目 |
| `/projects/:id` | DELETE | 删除项目 |

### 成员管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/projects/:id/members` | GET | 获取项目成员 |
| `/projects/:id/members` | POST | 添加成员 |
| `/projects/:id/members/:userId` | DELETE | 移除成员 |

### 进度追踪

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/projects/:id/progress` | GET | 获取项目进度 |
| `/projects/:id/burndown` | GET | 获取燃尽图数据 |
| `/projects/modules/:moduleId/progress` | GET | 获取模块进度 |

### 基线管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/projects/:id/baselines` | GET | 获取基线列表 |
| `/projects/:id/baselines` | POST | 创建基线 |
| `/projects/baselines/:baselineId` | GET | 获取基线详情 |
| `/projects/baselines/:baselineId/restore` | POST | 恢复基线 |
| `/projects/baselines/:baselineId` | DELETE | 删除基线 |
| `/projects/baselines/:id1/compare/:id2` | GET | 对比基线 |

---

## 项目管理

### 获取项目列表

```http
GET /projects?page=1&limit=10
Authorization: Bearer <token>
```

**响应：**

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "项目名称",
      "key": "PROJ",
      "description": "项目描述",
      "status": "active",
      "createdAt": "2026-04-20T10:00:00Z",
      "updatedAt": "2026-04-20T12:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

### 创建项目

```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "项目名称",
  "key": "PROJ",
  "description": "项目描述"
}
```

**响应：**

```json
{
  "id": "uuid",
  "name": "项目名称",
  "key": "PROJ",
  "description": "项目描述",
  "status": "active",
  "createdAt": "2026-04-20T10:00:00Z"
}
```

### 获取项目详情

```http
GET /projects/:id
Authorization: Bearer <token>
```

### 根据项目标识获取项目

```http
GET /projects/key/:projectKey
Authorization: Bearer <token>
```

### 更新项目

```http
PUT /projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新名称",
  "description": "新描述"
}
```

### 删除项目

```http
DELETE /projects/:id
Authorization: Bearer <token>
```

**响应：** 204 No Content

---

## 成员管理

### 获取项目成员

```http
GET /projects/:id/members
Authorization: Bearer <token>
```

**响应：**

```json
[
  {
    "id": "uuid",
    "username": "user1",
    "displayName": "用户1",
    "role": "member"
  }
]
```

### 添加成员

```http
POST /projects/:id/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "uuid",
  "role": "member"
}
```

### 移除成员

```http
DELETE /projects/:id/members/:userId
Authorization: Bearer <token>
```

---

## 进度追踪

### 获取项目进度

```http
GET /projects/:id/progress
Authorization: Bearer <token>
```

### 获取燃尽图数据

```http
GET /projects/:id/burndown?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer <token>
```

### 获取模块进度

```http
GET /projects/modules/:moduleId/progress
Authorization: Bearer <token>
```

---

## 基线管理

### 获取基线列表

```http
GET /projects/:id/baselines
Authorization: Bearer <token>
```

### 创建基线

```http
POST /projects/:id/baselines
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "v1.0 基线",
  "description": "里程碑版本"
}
```

### 获取基线详情

```http
GET /projects/baselines/:baselineId
Authorization: Bearer <token>
```

### 恢复基线

```http
POST /projects/baselines/:baselineId/restore
Authorization: Bearer <token>
```

**响应：** 204 No Content

### 删除基线

```http
DELETE /projects/baselines/:baselineId
Authorization: Bearer <token>
```

**响应：** 204 No Content

### 对比基线

```http
GET /projects/baselines/:baselineId1/compare/:baselineId2
Authorization: Bearer <token>
```
