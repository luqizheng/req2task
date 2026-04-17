# Sprint 索引

## 概览

| 计划类型 | Sprint 数量 | 完成 | 进行中 | 待开始 |
|----------|-------------|------|--------|--------|
| 后端实施路线图 | 12 | 10 | 1 | 1 |
| 前端开发计划 | 11 | 2 | 1 | 8 |
| **总计** | **23** | **12** | **2** | **9** |

---

## 后端实施路线图

| Sprint | 名称 | 状态 | 交付内容 | 里程碑 |
|--------|------|------|----------|--------|
| Sprint 01 | [基础设施准备](sprint-01-implementation-infrastructure.md) | ✅ 完成 | Docker Compose、TypeORM、用户模块重构 | - |
| Sprint 02 | [项目与模块管理](sprint-02-implementation-projects-modules.md) | ✅ 完成 | Project、FeatureModule 完整 API | M1 |
| Sprint 03 | [需求管理基础](sprint-03-implementation-requirements-basics.md) | ✅ 完成 | Requirement、UserStory、AcceptanceCriteria API | M1 |
| Sprint 04 | [需求状态与变更](sprint-04-implementation-requirements-workflow.md) | ✅ 完成 | 状态机、变更日志、评审流程 | M2 |
| Sprint 05 | [任务管理](sprint-05-implementation-task-management.md) | ✅ 完成 | Task、依赖管理、任务分配 | M2 |
| Sprint 06 | [任务状态与看板](sprint-06-implementation-task-board.md) | ✅ 完成 | 看板视图、任务统计 | M2 |
| Sprint 07 | [AI 基础设施](sprint-07-implementation-ai-infrastructure.md) | ✅ 完成 | LLM 配置、向量数据库集成 | M3 |
| Sprint 08 | [AI 需求生成](sprint-08-implementation-ai-requirement-gen.md) | ✅ 完成 | AI 生成需求、用户故事、验收条件 | M3 |
| Sprint 09 | [AI 冲突检测](sprint-09-implementation-ai-conflict.md) | ✅ 完成 | 语义检索、冲突分析、AI Chat | M4 |
| Sprint 10 | [AI 增强与优化](sprint-10-implementation-ai-enhancement.md) | ✅ 完成 | 任务分解、工时估算、相似推荐 | M4 |
| Sprint 11 | [高级功能 - 上](sprint-11-implementation-advanced-part1.md) | 🚧 进行中 | 项目看板、报表、基线管理 | M5 |
| Sprint 12 | [高级功能 - 下](sprint-12-implementation-advanced-part2.md) | ⏳ 待开始 | 权限完善、通知系统、集成测试 | M5 |

### 后端 Sprint 11-12 待完成项

| 模块 | 状态 | 说明 |
|------|------|------|
| BaselineService | ✅ 已实现 | 服务层完成，未注册到模块 |
| ProjectProgressService | ✅ 已实现 | 服务层完成，未注册到模块 |
| 基线管理 API | ⏳ 待开发 | 需添加 Controller |
| 进度看板 API | ⏳ 待开发 | 需添加 Controller |
| 通知系统 | ⏳ 待开发 | Notification Module |

---

## 前端开发计划

| Sprint | 名称 | 状态 | 交付内容 | 里程碑 |
|--------|------|------|----------|--------|
| Sprint 00 | [用户与认证管理](sprint-00-frontend-user-auth.md) | ✅ 完成 | 用户 CRUD、个人中心、修改密码 | M0 |
| Sprint 01 | [项目与模块管理](sprint-01-frontend-projects-modules.md) | ⏳ 待开始 | ProjectListView、ProjectDetailView | M1 |
| Sprint 02 | [需求管理基础](sprint-02-frontend-requirements-basics.md) | ⏳ 待开始 | RequirementListView、RequirementDetailView | M1 |
| Sprint 03 | [需求状态与工作流](sprint-03-frontend-requirements-workflow.md) | ⏳ 待开始 | 状态流转、变更历史、评审组件 | M2 |
| Sprint 04 | [任务管理](sprint-04-frontend-task-management.md) | ⏳ 待开始 | TaskBoardView、TaskDetailView | M2 |
| Sprint 05 | [AI 配置与对话](sprint-05-frontend-ai-chat.md) | ✅ 完成 | AiConfigView、AI Chat 集成 | M3 |
| Sprint 06 | [AI 需求生成](sprint-06-frontend-ai-requirement-gen.md) | ✅ 完成 | 需求生成、用户故事、验收条件生成 UI | M3 |
| Sprint 07 | [AI 冲突检测与分解](sprint-07-frontend-ai-conflict.md) | ⏳ 待开始 | 冲突检测、语义检索、任务分解 UI | M4 |
| Sprint 08 | [仪表板与集成](sprint-08-frontend-dashboard-integration.md) | ⏳ 待开始 | DashboardView 对接、路由整合 | M4 |
| Sprint 09 | [高级功能与优化 - 上](sprint-09-frontend-advanced-part1.md) | ⏳ 待开始 | 进度看板、基线管理、通知组件 | M5 |
| Sprint 10 | [高级功能与优化 - 下](sprint-10-frontend-advanced-part2.md) | ⏳ 待开始 | 性能优化、E2E 测试、响应式适配 | M5 |

### 前端 Sprint 0 待开发项

| 模块 | 状态 | 说明 |
|------|------|------|
| UserManageView.vue | ⚠️ 待对接 | 页面已创建，使用静态数据 |
| api/users.ts | ⏳ 待开发 | 需创建 API 调用层 |
| stores/user.ts | ⚠️ 待完善 | Store 已存在，需完善 |
| ProfileView.vue | ⏳ 待开发 | 个人中心页面 |
| 修改密码 | ⏳ 待开发 | 密码修改功能 |

---

## 里程碑进度

| 里程碑 | 目标 Sprint | 后端状态 | 前端状态 |
|--------|-------------|----------|----------|
| M0 | Sprint 0 | ✅ 完成 | ✅ 完成 |
| M1 | Sprint 2 | ✅ 完成 | ⏳ 待开始 |
| M2 | Sprint 4 | ✅ 完成 | ⏳ 待开始 |
| M3 | Sprint 6 | ✅ 完成 | ✅ 完成 |
| M4 | Sprint 8 | ✅ 完成 | ⏳ 待开始 |
| M5 | Sprint 10-12 | 🚧 进行中 | ⏳ 待开始 |

---

## 状态说明

- ⏳ **待开始**: 尚未开始
- 🚧 **进行中**: 正在开发
- ✅ **已完成**: 已完成并验收
- ⚠️ **待对接**: 部分完成，需对接
- ❌ **已取消**: 已取消
- ⚠️ **有阻塞**: 遇到阻塞问题

---

## 更新日志

- 2026-04-17: 初始化 Sprint 索引，创建拆分文件
- 2026-04-17: 更新后端 Sprint 状态 (Sprint 01-10 ✅ 完成, Sprint 11 🚧 进行中, Sprint 12 ⏳ 待开始)
- 2026-04-17: 添加前端 Sprint 00 用户与认证管理
