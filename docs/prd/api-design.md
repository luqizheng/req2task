# API 接口设计

## 4.1 项目管理

- `POST /projects` - 创建项目
- `GET /projects` - 获取项目列表
- `GET /projects/:id` - 获取项目详情
- `PUT /projects/:id` - 更新项目
- `DELETE /projects/:id` - 删除项目
- `POST /projects/:id/members` - 添加项目成员
- `DELETE /projects/:id/members/:userId` - 移除项目成员

## 4.2 原始需求管理

- `POST /raw-collections/:projectId/raw-collections` - 创建原始需求收集
- `GET /raw-collections/:projectId/raw-collections` - 获取原始需求收集列表
- `GET /raw-collections/:id` - 获取原始需求收集详情
- `PUT /raw-collections/:id` - 更新原始需求收集
- `DELETE /raw-collections/:id` - 删除原始需求收集
- `POST /raw-collections/:collectionId/raw-requirements` - 添加原始需求到收集
- `GET /raw-collections/:collectionId/raw-requirements` - 获取收集中的原始需求
- `DELETE /raw-collections/:collectionId/raw-requirements/:requirementId` - 从收集中移除原始需求

## 4.3 功能模块管理

- `POST /modules/:projectId/modules` - 创建功能模块
- `GET /modules/:projectId/modules` - 获取功能模块列表
- `PUT /modules/:id` - 更新功能模块
- `DELETE /modules/:id` - 删除功能模块

## 4.4 需求管理

- `POST /requirements/modules/:moduleId/requirements` - 创建需求
- `GET /requirements/modules/:moduleId/requirements` - 获取需求列表
- `GET /requirements/:id` - 获取需求详情
- `PUT /requirements/:id` - 更新需求
- `DELETE /requirements/:id` - 删除需求
- `POST /requirements/:id/approve` - 审批需求
- `GET /requirements/:id/changes` - 获取需求变更历史

## 4.5 用户故事管理

- `POST /user-stories/:requirementId/user-stories` - 创建用户故事
- `GET /user-stories/:requirementId/user-stories` - 获取用户故事列表
- `PUT /user-stories/:id` - 更新用户故事
- `DELETE /user-stories/:id` - 删除用户故事

## 4.6 验收条件管理

- `POST /acceptance-criteria/:userStoryId/acceptance-criteria` - 创建验收条件
- `GET /acceptance-criteria/:userStoryId/acceptance-criteria` - 获取验收条件列表
- `PUT /acceptance-criteria/:id` - 更新验收条件
- `DELETE /acceptance-criteria/:id` - 删除验收条件

## 4.7 AI 能力

- `POST /ai-generate` - AI 生成需求（含用户故事+验收条件）
- `POST /ai-breakdown` - AI 分解需求为任务并估算工时
- `POST /ai-score` - AI 评审预判
- `POST /:project-id/ai-similar` - AI 推荐相似需求

## 4.8 任务管理

- `POST /tasks/:requirementId/tasks` - 创建任务
- `GET /tasks/:requirementId/tasks` - 获取需求下的任务
- `GET /tasks/:id` - 获取任务详情
- `PUT /tasks/:id` - 更新任务
- `DELETE /tasks/:id` - 删除任务
- `PUT /tasks/:id/status` - 更新任务状态
- `POST /tasks/:id/assign` - 分配任务

## 4.9 任务依赖

- `POST /tasks/:id/dependencies` - 添加任务依赖
- `DELETE /tasks/:id/dependencies/:depId` - 移除任务依赖
- `GET /tasks/:id/dependencies` - 获取任务依赖列表

***

**上一级**：[权限与工作流](permission-workflow.md)\
**下一级**：[数据模型](data-models.md)
