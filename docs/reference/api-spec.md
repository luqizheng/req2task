---
last_updated: 2026-04-17
status: active
owner: req2task团队
---

# API 规范文档

## 1. 项目管理

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

## 2. 功能模块管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/modules/:projectId/modules` | POST | 创建功能模块 |
| `/modules/:projectId/modules` | GET | 获取功能模块列表 |
| `/modules/:id` | GET | 获取功能模块详情 |
| `/modules/:id` | PUT | 更新功能模块 |
| `/modules/:id` | DELETE | 删除功能模块 |

## 3. 需求管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
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

## 4. 用户故事管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/user-stories/:requirementId/user-stories` | POST | 创建用户故事 |
| `/user-stories/:requirementId/user-stories` | GET | 获取用户故事列表 |
| `/user-stories/:id` | GET | 获取用户故事详情 |
| `/user-stories/:id` | PUT | 更新用户故事 |
| `/user-stories/:id` | DELETE | 删除用户故事 |

## 5. 验收条件管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/acceptance-criteria/:userStoryId/acceptance-criteria` | POST | 创建验收条件 |
| `/acceptance-criteria/:userStoryId/acceptance-criteria` | GET | 获取验收条件列表 |
| `/acceptance-criteria/:id` | PUT | 更新验收条件 |
| `/acceptance-criteria/:id` | DELETE | 删除验收条件 |

## 6. 任务管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/tasks/:requirementId/tasks` | POST | 创建任务 |
| `/tasks/:requirementId/tasks` | GET | 获取需求下的任务 |
| `/tasks/:id` | GET | 获取任务详情 |
| `/tasks/:id` | PUT | 更新任务 |
| `/tasks/:id` | DELETE | 删除任务 |
| `/tasks/:id/status` | PUT | 更新任务状态 |
| `/tasks/:id/assign` | POST | 分配任务 |

## 7. 任务依赖

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/tasks/:id/dependencies` | POST | 添加任务依赖 |
| `/tasks/:id/dependencies` | GET | 获取任务依赖列表 |
| `/tasks/:id/dependencies/:depId` | DELETE | 移除任务依赖 |

## 8. 原始需求管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/raw-collections/:projectId/raw-collections` | POST | 创建原始需求收集 |
| `/raw-collections/:projectId/raw-collections` | GET | 获取原始需求收集列表 |
| `/raw-collections/:id` | GET | 获取原始需求收集详情 |
| `/raw-collections/:id` | PUT | 更新原始需求收集 |
| `/raw-collections/:id` | DELETE | 删除原始需求收集 |
| `/raw-collections/:collectionId/raw-requirements` | POST | 添加原始需求到收集 |
| `/raw-collections/:collectionId/raw-requirements` | GET | 获取收集中的原始需求 |
| `/raw-collections/:collectionId/raw-requirements/:requirementId` | DELETE | 从收集中移除原始需求 |

## 9. AI 能力

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/ai-generate` | POST | AI 生成需求（含用户故事+验收条件） |
| `/ai-breakdown` | POST | AI 分解需求为任务并估算工时 |
| `/ai-score` | POST | AI 评审预判 |
| `/:project-id/ai-similar` | POST | AI 推荐相似需求 |
| `/ai/chat` | POST | AI 需求分析对话 |
| `/ai/context/:projectId` | GET | 获取上下文关联 |
| `/ai/resolve-conflict` | POST | 冲突确认处理 |

## 10. LLM 配置

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/llm/call` | POST | 调用默认 LLM 服务 |
| `/llm/stream` | POST | 流式调用默认 LLM 服务 |
| `/llm/call/:provider` | POST | 调用指定提供商 |
| `/llm/health` | GET | 获取健康状态 |
| `/llm/config` | GET | 获取所有配置 |
| `/llm/config` | POST | 创建配置 |
| `/llm/config/default` | GET | 获取默认配置 |
| `/llm/config/:id` | GET | 获取单个配置 |
| `/llm/config/:id` | PUT | 更新配置 |
| `/llm/config/:id` | DELETE | 删除配置 |
| `/llm/config/:id/set-default` | POST | 设置默认配置 |

## 11. 基线管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/projects/:id/baselines` | GET | 获取项目基线列表 |
| `/projects/:id/baselines` | POST | 创建新基线 |
| `/projects/:id/baselines/:baselineId` | GET | 获取基线详情 |
| `/projects/:id/baselines/:baselineId/restore` | POST | 恢复到基线 |

## 12. 统一响应格式

### 成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### 分页响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### 错误响应

```json
{
  "code": "VALIDATION_ERROR",
  "message": "请求参数验证失败",
  "errors": [
    { "field": "name", "message": "名称不能为空" }
  ]
}
```

## 13. 认证方式

所有 API 需要在请求头中携带 JWT Token：

```
Authorization: Bearer <token>
```

## 14. 常用状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 204 | 删除成功（无内容） |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
