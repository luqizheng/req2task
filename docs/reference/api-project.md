# 项目管理 API

## 端点总览

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/projects` | POST | 创建项目 |
| `/projects` | GET | 获取项目列表 |
| `/projects/:id` | GET | 获取项目详情 |
| `/projects/:id` | PUT | 更新项目 |
| `/projects/:id` | DELETE | 删除项目 |
| `/projects/:id/members` | POST | 添加项目成员 |
| `/projects/:id/members` | GET | 获取项目成员 |
| `/projects/:id/members/:userId` | DELETE | 移除项目成员 |
| `/projects/:id/baselines` | GET | 获取项目基线列表 |
| `/projects/:id/baselines` | POST | 创建新基线 |
| `/projects/:id/baselines/:baselineId` | GET | 获取基线详情 |
| `/projects/:id/baselines/:baselineId/restore` | POST | 恢复到基线 |

---

## 项目管理

### 创建项目

```http
POST /projects
Content-Type: application/json

{
  "name": "项目名称",
  "description": "项目描述",
  "key": "PROJECT_KEY"             // 项目标识符
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "name": "项目名称",
    "description": "项目描述",
    "key": "PROJECT_KEY",
    "createdAt": "2026-04-20T10:00:00Z"
  }
}
```

### 获取项目列表

```http
GET /projects
```

### 获取项目详情

```http
GET /projects/:id
```

### 更新项目

```http
PUT /projects/:id
Content-Type: application/json

{
  "name": "更新后的名称",
  "description": "更新后的描述"
}
```

### 删除项目

```http
DELETE /projects/:id
```

---

## 项目成员管理

### 添加项目成员

```http
POST /projects/:id/members
Content-Type: application/json

{
  "userId": "uuid",
  "role": "developer"               // developer | analyst | viewer
}
```

### 获取项目成员

```http
GET /projects/:id/members
```

**响应：**

```json
{
  "code": 0,
  "data": [
    {
      "userId": "uuid",
      "displayName": "张三",
      "role": "developer",
      "joinedAt": "2026-04-20T10:00:00Z"
    }
  ]
}
```

### 移除项目成员

```http
DELETE /projects/:id/members/:userId
```

---

## 基线管理

### 获取基线列表

```http
GET /projects/:id/baselines
```

### 创建基线

```http
POST /projects/:id/baselines
Content-Type: application/json

{
  "name": "基线名称",
  "description": "基线描述"
}
```

### 获取基线详情

```http
GET /projects/:id/baselines/:baselineId
```

### 恢复到基线

```http
POST /projects/:id/baselines/:baselineId/restore
```

---

## 数据模型

### ProjectMemberRole 枚举

```typescript
type ProjectMemberRole = 'owner' | 'developer' | 'analyst' | 'viewer';
```

| 值 | 说明 |
|----|------|
| `owner` | 所有者 |
| `developer` | 开发人员 |
| `analyst` | 需求分析师 |
| `viewer` | 查看者 |
