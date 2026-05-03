# API 规范总览

本文档汇总了 req2task 系统的所有 API 接口。

---

## 服务架构

系统包含两个主要服务：

| 服务 | 地址 | 说明 |
|------|------|------|
| Main Service | `http://localhost:4000` | 核心业务服务（NestJS） |
| AI Chat Service | `http://localhost:4001` | AI 对话服务（Express） |

---

## API 文档索引

### 核心业务 API

| 文档 | 说明 | 基础路径 |
|------|------|----------|
| [api-project.md](api-project.md) | 项目管理 | `/projects` |
| [api-requirement.md](api-requirement.md) | 需求管理 | `/requirements` |
| [api-task.md](api-task.md) | 任务管理 | `/tasks` |
| [api-collection.md](api-collection.md) | 原始需求管理 | `/raw-requirements` |

### AI 服务 API

| 文档 | 说明 | 基础路径 |
|------|------|----------|
| [api-conversation.md](api-conversation.md) | 对话管理 | `/api/ai` |
| [api-llm-config.md](api-llm-config.md) | LLM 配置 | `/api/ai/llm-configs` |

### 其他 API

| 接口 | 说明 | 文档 |
|------|------|------|
| 用户认证 | 登录/注册 | 见下方认证章节 |
| 用户管理 | 用户 CRUD | 见下方用户章节 |
| 功能模块 | 模块管理 | 见下方模块章节 |
| 用户故事 | 故事管理 | 见下方用户故事章节 |
| 验收标准 | 标准管理 | 见下方验收标准章节 |
| 文件存储 | 文件上传/下载 | 见下方文件章节 |
| 通知 | 消息通知 | 见下方通知章节 |
| AI 生成 | 任务/模块/验收标准生成 | 见下方 AI 生成章节 |
| 向量重建 | 语义搜索索引重建 | 见下方向量章节 |

---

## 认证 API

### 注册

```http
POST /auth/register
Content-Type: application/json

{
  "username": "user1",
  "email": "user1@example.com",
  "password": "password123",
  "displayName": "用户1"
}
```

### 登录

```http
POST /auth/login
Content-Type: application/json

{
  "username": "user1",
  "password": "password123"
}
```

**响应：**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "uuid",
    "username": "user1",
    "displayName": "用户1"
  }
}
```

---

## 用户 API

### 获取当前用户

```http
GET /users/me
Authorization: Bearer <token>
```

### 更新个人信息

```http
PUT /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "新名称",
  "email": "new@example.com"
}
```

### 修改密码

```http
PUT /users/me/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "旧密码",
  "newPassword": "新密码"
}
```

### 获取公开用户列表

```http
GET /users/public?page=1&limit=10
```

---

## 功能模块 API

### 获取模块列表

```http
GET /feature-modules?projectId=uuid&page=1&limit=10
Authorization: Bearer <token>
```

### 获取模块树

```http
GET /feature-modules/tree/:projectId
Authorization: Bearer <token>
```

### 创建模块

```http
POST /feature-modules
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "uuid",
  "name": "模块名称",
  "description": "模块描述",
  "parentId": "uuid"
}
```

### 更新模块

```http
PUT /feature-modules/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新名称",
  "description": "新描述"
}
```

### 删除模块

```http
DELETE /feature-modules/:id
Authorization: Bearer <token>
```

---

## 用户故事 API

### 创建用户故事

```http
POST /user-stories/:requirementId/user-stories
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "作为用户",
  "goal": "我想要一个功能",
  "benefit": "以便实现某个目标",
  "storyPoints": 5
}
```

### 获取用户故事列表

```http
GET /user-stories/:requirementId/user-stories
Authorization: Bearer <token>
```

### 更新用户故事

```http
PUT /user-stories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "作为管理员",
  "goal": "我想要管理功能",
  "benefit": "以便管理系统"
}
```

### 删除用户故事

```http
DELETE /user-stories/:id
Authorization: Bearer <token>
```

### AI 生成用户故事

```http
POST /requirements/:requirementId/user-stories/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "featurePoints": ["功能点1", "功能点2"],
  "context": "额外上下文"
}
```

---

## 验收标准 API

### 创建验收标准

```http
POST /acceptance-criteria/:userStoryId/acceptance-criteria
Authorization: Bearer <token>
Content-Type: application/json

{
  "criteriaType": "functional",
  "content": "验收标准内容",
  "testMethod": "测试方法"
}
```

### 获取验收标准列表

```http
GET /acceptance-criteria/:userStoryId/acceptance-criteria
Authorization: Bearer <token>
```

### 更新验收标准

```http
PUT /acceptance-criteria/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "更新后的内容",
  "testMethod": "新的测试方法"
}
```

### 删除验收标准

```http
DELETE /acceptance-criteria/:id
Authorization: Bearer <token>
```

---

## 文件存储 API

### 上传文件

```http
POST /file-data/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <二进制文件>
```

**响应：**

```json
{
  "fileDataId": "uuid"
}
```

### 批量获取文件

```http
GET /file-data/batch?ids=id1,id2,id3
Authorization: Bearer <token>
```

### 删除文件

```http
DELETE /file-data/:id
Authorization: Bearer <token>
```

---

## 附件 API

### 创建附件

```http
POST /attachments/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "uuid",
  "fileDataId": "uuid",
  "targetType": "requirement",
  "targetId": "uuid",
  "displayName": "附件名称"
}
```

### 获取附件

```http
GET /attachments/:id
Authorization: Bearer <token>
```

### 查询附件

```http
GET /attachments?targetType=requirement&targetId=uuid
Authorization: Bearer <token>
```

### 批量获取附件

```http
POST /attachments/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": ["id1", "id2"]
}
```

### 下载附件

```http
GET /attachments/:id/download
Authorization: Bearer <token>
```

### 删除附件

```http
DELETE /attachments/:id
Authorization: Bearer <token>
```

---

## 通知 API

### 获取通知列表

```http
GET /notifications?page=1&limit=20
Authorization: Bearer <token>
```

### 获取未读数量

```http
GET /notifications/unread-count
Authorization: Bearer <token>
```

**响应：**

```json
{
  "unreadCount": 5
}
```

### 标记已读

```http
POST /notifications/:id/read
Authorization: Bearer <token>
```

### 全部标记已读

```http
POST /notifications/read-all
Authorization: Bearer <token>
```

### 删除通知

```http
DELETE /notifications/:id
Authorization: Bearer <token>
```

---

## AI 生成 API

### 生成任务

```http
POST /llm/generation/tasks/:requirementId
Authorization: Bearer <token>
Content-Type: application/json

{
  "featurePoints": ["功能点1", "功能点2"],
  "context": "额外上下文"
}
```

### 生成功能模块

```http
POST /llm/generation/modules/:projectId
Authorization: Bearer <token>
Content-Type: application/json

{
  "requirements": ["需求1", "需求2"],
  "context": "额外上下文",
  "existingModulesTree": "现有模块结构"
}
```

### 生成验收标准

```http
POST /llm/generation/acceptance-criteria/:userStoryId
Authorization: Bearer <token>
Content-Type: application/json

{
  "context": "额外上下文"
}
```

---

## 向量搜索 API

### 重建向量索引

```http
POST /llm/vector/rebuild
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "uuid"
}
```

**响应：**

```json
{
  "success": true,
  "message": "Vector store rebuilt successfully",
  "data": {
    "requirements": 100,
    "rawRequirements": 50,
    "total": 150
  }
}
```

---

## 通用规范

### 响应格式

所有 API 返回统一格式：

```json
{
  "code": 0,
  "data": {},
  "message": "操作成功"
}
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| `0` | 成功 |
| `1` | 通用错误 |
| `400` | 请求参数错误 |
| `401` | 未授权 |
| `403` | 禁止访问 |
| `404` | 资源不存在 |
| `500` | 服务器错误 |

### 认证方式

所有需要认证的接口在请求头中携带：

```
Authorization: Bearer <accessToken>
```

### SSE 协议

流式接口使用 Server-Sent Events 协议，详见 [sse-protocol.md](sse-protocol.md)。
