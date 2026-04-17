# API 详细设计

## 1. 通用规范

### 1.1 请求格式

```http
Content-Type: application/json
Authorization: Bearer <token>
```

### 1.2 响应格式

body 如果是提交文件 ，则 body 为空

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "time": "datetime",
  "url": "string",
  "method": "string",
  "body": "string"
}
```

### 1.3 分页格式

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### 1.4 错误码定义

| 错误码 | 说明           |
| ------ | -------------- |
| 0      | 成功           |
| 400    | 请求参数错误   |
| 401    | 未认证         |
| 403    | 无权限         |
| 404    | 资源不存在     |
| 409    | 资源冲突       |
| 500    | 服务器内部错误 |

---

## 2. 认证相关

### 2.1 登录

```http
POST /api/auth/login
```

**请求**

```json
{
  "email": "string",
  "password": "string"
}
```

**响应**

```json
{
  "code": 0,
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiresIn": 7200,
    "user": {
      "id": "uuid",
      "email": "string",
      "name": "string",
      "avatar": "string"
    }
  }
}
```

---

## 3. 项目管理

### 3.1 创建项目

```http
POST /api/projects
```

**请求**

```json
{
  "name": "string",
  "description": "string",
  "estimatedManDays": 100,
  "budgetManDays": 120,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

**响应**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "status": "planning",
    "estimatedManDays": 100,
    "budgetManDays": 120,
    "actualManDays": 0,
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "ownerId": "uuid",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 3.2 项目列表

```http
GET /api/projects
```

**查询参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| status | enum | planning/active/completed/archived |
| page | number | 页码，默认1 |
| pageSize | number | 每页数量，默认20 |
| keyword | string | 搜索关键词 |

**响应**

```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "string",
        "status": "planning",
        "memberCount": 5,
        "requirementCount": 20,
        "taskCompletionRate": 0.75,
        "createdAt": "datetime"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### 3.3 项目详情

```http
GET /api/projects/:id
```

**响应**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "status": "active",
    "estimatedManDays": 100,
    "budgetManDays": 120,
    "actualManDays": 45.5,
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "owner": {
      "id": "uuid",
      "name": "string",
      "email": "string"
    },
    "statistics": {
      "moduleCount": 8,
      "requirementCount": 50,
      "taskCount": 150,
      "completedTaskCount": 100,
      "wastedManDays": 5
    },
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 3.4 更新项目

```http
PUT /api/projects/:id
```

**请求**

```json
{
  "name": "string",
  "description": "string",
  "status": "active",
  "estimatedManDays": 120,
  "budgetManDays": 150,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

### 3.5 删除项目

```http
DELETE /api/projects/:id
```

**响应**

```json
{
  "code": 0,
  "message": "删除成功"
}
```

### 3.6 项目成员管理

#### 添加成员

```http
POST /api/projects/:id/members
```

**请求**

```json
{
  "userId": "uuid",
  "role": "manager"
}
```

**响应**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "userId": "uuid",
    "role": "manager",
    "joinedAt": "datetime"
  }
}
```

#### 成员列表

```http
GET /api/projects/:id/members
```

**响应**

```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "string",
        "email": "string",
        "avatar": "string"
      },
      "role": "manager",
      "joinedAt": "datetime"
    }
  ]
}
```

#### 移除成员

```http
DELETE /api/projects/:id/members/:userId
```

---

## 4. 功能模块管理

### 4.1 创建模块

```http
POST /api/modules/:projectId/modules
```

**请求**

```json
{
  "name": "string",
  "description": "string",
  "parentModuleId": "uuid",
  "moduleType": "business",
  "sortOrder": 1
}
```

**响应**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "name": "string",
    "description": "string",
    "parentModuleId": "uuid",
    "moduleType": "business",
    "status": "planning",
    "estimatedStoryPoints": 0,
    "sortOrder": 1,
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 4.2 模块列表

```http
GET /api/modules/:projectId/modules
```

**响应**

```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "moduleType": "business",
      "status": "development",
      "requirementCount": 10,
      "taskCompletionRate": 0.6,
      "children": []
    }
  ]
}
```

---

## 5. 需求管理

### 5.1 创建需求

```http
POST /api/requirements/modules/:moduleId/requirements
```

**请求**

```json
{
  "title": "string",
  "description": "string",
  "priority": "high",
  "source": "manual",
  "parentRequirementId": "uuid"
}
```

**响应**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "moduleId": "uuid",
    "title": "string",
    "description": "string",
    "priority": "high",
    "source": "manual",
    "status": "draft",
    "storyPoints": 0,
    "parentRequirementId": "uuid",
    "createdById": "uuid",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 5.2 需求列表

```http
GET /api/requirements/modules/:moduleId/requirements
```

**查询参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| status | enum | 需求状态 |
| priority | enum | 优先级 |
| createdById | uuid | 创建人 |
| keyword | string | 搜索关键词 |
| page | number | 页码 |
| pageSize | number | 每页数量 |

**响应**

```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "string",
        "priority": "high",
        "status": "draft",
        "storyPoints": 8,
        "userStoryCount": 2,
        "taskCount": 5,
        "createdBy": {
          "id": "uuid",
          "name": "string"
        },
        "createdAt": "datetime"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

### 5.3 需求详情

```http
GET /api/requirements/:id
```

**响应**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "moduleId": "uuid",
    "title": "string",
    "description": "string",
    "priority": "high",
    "source": "manual",
    "status": "draft",
    "storyPoints": 8,
    "parentRequirementId": "uuid",
    "createdBy": {
      "id": "uuid",
      "name": "string"
    },
    "userStories": [
      {
        "id": "uuid",
        "role": "string",
        "goal": "string",
        "benefit": "string",
        "storyPoints": 5,
        "acceptanceCriteria": []
      }
    ],
    "tasks": [
      {
        "id": "uuid",
        "taskNumber": "REQ-0001-TASK-001",
        "title": "string",
        "status": "todo",
        "priority": "high",
        "assignee": {
          "id": "uuid",
          "name": "string"
        },
        "estimatedHours": 8
      }
    ],
    "changeLogs": [],
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 5.4 更新需求

```http
PUT /api/requirements/:id
```

**请求**

```json
{
  "title": "string",
  "description": "string",
  "priority": "medium",
  "status": "reviewed"
}
```

### 5.5 需求审批

```http
POST /api/requirements/:id/approve
```

**请求**

```json
{
  "action": "approve",
  "comment": "string"
}
```

### 5.6 需求变更历史

```http
GET /api/requirements/:id/changes
```

**响应**

```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "requirementId": "uuid",
      "changeType": "update",
      "fieldName": "description",
      "oldValue": "string",
      "newValue": "string",
      "changeReason": "string",
      "changedBy": {
        "id": "uuid",
        "name": "string"
      },
      "createdAt": "datetime"
    }
  ]
}
```

---

## 6. 用户故事管理

### 6.1 创建用户故事

```http
POST /api/user-stories/:requirementId/user-stories
```

**请求**

```json
{
  "role": "string",
  "goal": "string",
  "benefit": "string",
  "storyPoints": 5
}
```

**响应**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "requirementId": "uuid",
    "role": "string",
    "goal": "string",
    "benefit": "string",
    "storyPoints": 5,
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 6.2 用户故事列表

```http
GET /api/user-stories/:requirementId/user-stories
```

---

## 7. 验收条件管理

### 7.1 创建验收条件

```http
POST /api/acceptance-criteria/:userStoryId/acceptance-criteria
```

**请求**

```json
{
  "criteriaType": "functional",
  "content": "Given...When...Then...",
  "testMethod": "自动化测试"
}
```

**响应**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "userStoryId": "uuid",
    "criteriaType": "functional",
    "content": "Given...When...Then...",
    "testMethod": "自动化测试",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 7.2 验收条件列表

```http
GET /api/acceptance-criteria/:userStoryId/acceptance-criteria
```

---

## 8. 任务管理

### 8.1 创建任务

```http
POST /api/tasks/:requirementId/tasks
```

**请求**

```json
{
  "title": "string",
  "description": "string",
  "priority": "high",
  "type": "development",
  "assigneeType": "human",
  "assigneeId": "uuid",
  "estimatedHours": 8,
  "dueDate": "2024-01-15",
  "parentTaskId": "uuid"
}
```

**响应**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "taskNumber": "REQ-0001-TASK-001",
    "requirementId": "uuid",
    "title": "string",
    "description": "string",
    "priority": "high",
    "status": "todo",
    "type": "development",
    "assigneeType": "human",
    "assigneeId": "uuid",
    "estimatedHours": 8,
    "estimatedManDays": 1,
    "actualHours": null,
    "actualManDays": null,
    "isWasted": false,
    "dueDate": "2024-01-15",
    "parentTaskId": "uuid",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 8.2 任务列表

```http
GET /api/tasks/:requirementId/tasks
```

**查询参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| status | enum | 任务状态 |
| assigneeId | uuid | 负责人 |
| priority | enum | 优先级 |

**响应**

```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": "uuid",
        "taskNumber": "string",
        "title": "string",
        "status": "todo",
        "priority": "high",
        "assignee": {
          "id": "uuid",
          "name": "string"
        },
        "estimatedHours": 8,
        "dueDate": "datetime"
      }
    ],
    "total": 100
  }
}
```

### 8.3 任务详情

```http
GET /api/tasks/:id
```

### 8.4 更新任务

```http
PUT /api/tasks/:id
```

**请求**

```json
{
  "title": "string",
  "description": "string",
  "priority": "medium",
  "estimatedHours": 16,
  "dueDate": "2024-01-20"
}
```

### 8.5 更新任务状态

```http
PUT /api/tasks/:id/status
```

**请求**

```json
{
  "status": "in_progress"
}
```

### 8.6 分配任务

```http
POST /api/tasks/:id/assign
```

**请求**

```json
{
  "assigneeType": "human",
  "assigneeId": "uuid"
}
```

### 8.7 任务依赖管理

#### 添加依赖

```http
POST /api/tasks/:id/dependencies
```

**请求**

```json
{
  "prerequisiteTaskId": "uuid",
  "dependencyType": "blocks"
}
```

#### 获取依赖

```http
GET /api/tasks/:id/dependencies
```

#### 移除依赖

```http
DELETE /api/tasks/:id/dependencies/:depId
```

---

## 9. AI 能力

### 9.1 AI 生成需求

```http
POST /api/ai-generate
```

**请求**

```json
{
  "projectId": "uuid",
  "moduleId": "uuid",
  "rawRequirementContent": "string",
  "llmConfigId": "uuid"
}
```

**响应**

```json
{
  "code": 0,
  "data": {
    "requirement": {
      "id": "uuid",
      "title": "string",
      "description": "string"
    },
    "userStories": [
      {
        "id": "uuid",
        "role": "string",
        "goal": "string",
        "benefit": "string"
      }
    ],
    "acceptanceCriteria": [
      {
        "id": "uuid",
        "content": "string"
      }
    ]
  }
}
```

### 9.2 AI 分解任务

```http
POST /api/ai-breakdown
```

**请求**

```json
{
  "requirementId": "uuid",
  "llmConfigId": "uuid"
}
```

**响应**

```json
{
  "code": 0,
  "data": {
    "tasks": [
      {
        "title": "string",
        "description": "string",
        "priority": "high",
        "type": "development",
        "estimatedHours": 8,
        "dependencies": ["taskId"]
      }
    ]
  }
}
```

### 9.3 AI 评审预判

```http
POST /api/ai-score
```

**请求**

```json
{
  "requirementId": "uuid",
  "llmConfigId": "uuid"
}
```

**响应**

```json
{
  "code": 0,
  "data": {
    "totalScore": 85,
    "dimensions": [
      {
        "name": "完整性",
        "score": 90,
        "suggestions": ["建议补充...")
      },
      {
        "name": "清晰度",
        "score": 80,
        "suggestions": []
      }
    ],
    "issues": [
      {
        "severity": "warning",
        "message": "缺少验收条件",
        "position": "userStory"
      }
    ]
  }
}
```

### 9.4 AI 相似推荐

```http
GET /api/:projectId/ai-similar
```

**查询参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| requirementId | uuid | 参考需求 |
| limit | number | 返回数量 |

**响应**

```json
{
  "code": 0,
  "data": [
    {
      "requirement": {
        "id": "uuid",
        "title": "string"
      },
      "similarity": 0.85,
      "matchedPoints": ["功能相似", "技术方案类似"]
    }
  ]
}
```

---

## 10. 原始需求管理

### 10.1 创建原始需求收集

```http
POST /api/raw-collections/:projectId/raw-collections
```

**请求**

```json
{
  "title": "string",
  "collectionType": "meeting",
  "meetingMinutes": "string",
  "collectedAt": "datetime"
}
```

### 10.2 原始需求收集列表

```http
GET /api/raw-collections/:projectId/raw-collections
```

### 10.3 原始需求收集详情

```http
GET /api/raw-collections/:id
```

### 10.4 添加原始需求

```http
POST /api/raw-collections/:collectionId/raw-requirements
```

**请求**

```json
{
  "content": "string",
  "source": "string"
}
```

### 10.5 原始需求列表

```http
GET /api/raw-collections/:collectionId/raw-requirements
```

**响应**

```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": "uuid",
        "content": "string",
        "source": "string",
        "status": "pending",
        "createdAt": "datetime"
      }
    ],
    "total": 50
  }
}
```

---

## 11. LLM 配置管理

### 11.1 创建配置

```http
POST /api/llm/configs
```

**请求**

```json
{
  "name": "DeepSeek 生产配置",
  "provider": "deepseek",
  "modelId": "deepseek-chat",
  "apiKey": "sk-xxx",
  "apiEndpoint": "https://api.deepseek.com/v1",
  "temperature": 0.7,
  "maxTokens": 2000,
  "timeout": 30000,
  "maxRetries": 3,
  "isDefault": true
}
```

### 11.2 配置列表

```http
GET /api/llm/configs
```

**查询参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| provider | string | 提供商过滤 |
| activeOnly | boolean | 只返回启用配置 |
| page | number | 页码 |
| limit | number | 每页数量 |

### 11.3 配置详情

```http
GET /api/llm/configs/:id
```

### 11.4 更新配置

```http
PUT /api/llm/configs/:id
```

### 11.5 删除配置

```http
DELETE /api/llm/configs/:id
```

### 11.6 设置默认配置

```http
POST /api/llm/configs/:id/set-default
```

### 11.7 LLM 调用

```http
POST /api/llm/call
```

**请求**

```json
{
  "configId": "uuid",
  "provider": "deepseek",
  "messages": [{ "role": "user", "content": "你好" }]
}
```

---

## 12. 提示词管理

### 12.1 提示词列表

```http
GET /api/prompts
```

**响应**

```json
{
  "code": 0,
  "data": [
    {
      "code": "REQ_GENERATION",
      "name": "需求生成",
      "category": "requirement-generation",
      "description": "根据项目信息生成需求文档",
      "parameters": [
        {
          "name": "projectName",
          "type": "string",
          "required": true,
          "description": "项目名称"
        }
      ]
    }
  ]
}
```

### 12.2 提示词详情

```http
GET /api/prompts/:code
```

### 12.3 渲染提示词

```http
POST /api/prompts/:code/render
```

**请求**

```json
{
  "projectName": "电商平台",
  "projectType": "Web应用"
}
```

**响应**

```json
{
  "code": 0,
  "data": {
    "content": "渲染后的提示词内容"
  }
}
```

---

## 13. 公共类型定义

### 枚举类型

```typescript
// 项目状态
type ProjectStatus = "planning" | "active" | "completed" | "archived";

// 模块状态
type ModuleStatus = "planning" | "development" | "completed" | "deprecated";

// 需求状态
type RequirementStatus =
  | "draft"
  | "reviewed"
  | "approved"
  | "rejected"
  | "processing"
  | "completed"
  | "cancelled";

// 需求优先级
type Priority = "critical" | "high" | "medium" | "low";

// 需求来源
type RequirementSource = "manual" | "ai_generated" | "document_import";

// 任务状态
type TaskStatus =
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "blocked"
  | "cancelled"
  | "replaced";

// 任务类型
type TaskType =
  | "development"
  | "testing"
  | "documentation"
  | "deployment"
  | "other";

// 负责人类型
type AssigneeType = "human" | "ai_agent";

// 原始需求状态
type RawRequirementStatus =
  | "pending"
  | "processing"
  | "converted"
  | "discarded";

// 收集类型
type CollectionType = "meeting" | "interview" | "document" | "other";

// 项目成员角色
type ProjectRole = "owner" | "manager" | "developer" | "viewer";

// LLM 提供商
type LLMProvider = "deepseek" | "openai" | "ollama" | "minimax";

// 变更类型
type ChangeType = "create" | "update" | "delete" | "status_change";

// 依赖类型
type DependencyType = "blocks" | "relates_to";
```

### 分页请求

```typescript
interface PaginationRequest {
  page?: number;
  pageSize?: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```
