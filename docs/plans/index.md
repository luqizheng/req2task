# Sprint 索引

## 概览

| 计划类型 | Sprint 数量 | 完成 | 进行中 | 待开始 |
|----------|-------------|------|--------|--------|
| 后端实施路线图 | 15 | 13 | 0 | 2 |
| 前端开发计划 | 16 | 10 | 1 | 5 |
| **总计** | **25** | **24** | **0** | **1** |

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
| Sprint 11 | [高级功能 - 上](sprint-11-implementation-advanced-part1.md) | ✅ 完成 | 项目进度看板、燃尽图、基线管理 | M5 |
| Sprint 12 | [高级功能 - 下](sprint-12-implementation-advanced-part2.md) | ✅ 完成 | 权限管理系统、通知系统 | M5 |
| Sprint 13 | [精简 User 与角色关系](sprint-13-refactor-user-role-relation.md) | ✅ 完成 | RawRequirement→Requirement 1:N 关系修复 | M6 |
| Sprint 14 | 需求变更处理 | ⏳ 待开始 | 任务替代/废弃、工时统计 | M6 |
| Sprint 15 | 报表与集成 | ⏳ 待开始 | 报表导出、集成测试 | M6 |

---

## 前端开发计划

| Sprint | 名称 | 状态 | 交付内容 | 里程碑 |
|--------|------|------|----------|--------|
| Sprint 00 | [用户与认证管理](sprint-00-frontend-user-auth.md) | ✅ 完成 | 用户 CRUD、个人中心、修改密码 | M0 |
| Sprint 01 | [项目与模块管理](sprint-01-frontend-projects-modules.md) | ✅ 完成 | ProjectListView、ProjectDetailView | M1 |
| Sprint 02 | [需求管理基础](sprint-02-frontend-requirements-basics.md) | ✅ 完成 | RequirementListView、RequirementDetailView | M1 |
| Sprint 03 | [需求状态与工作流](sprint-03-frontend-requirements-workflow.md) | ✅ 完成 | 状态流转、变更历史、评审组件 | M2 |
| Sprint 04 | [任务管理](sprint-04-frontend-task-management.md) | ✅ 完成 | TaskBoardView、TaskDetailView | M2 |
| Sprint 05 | [AI 配置与对话](sprint-05-frontend-ai-chat.md) | ✅ 完成 | AiConfigView、AI Chat 集成 | M3 |
| Sprint 06 | [AI 需求生成](sprint-06-frontend-ai-requirement-gen.md) | ✅ 完成 | 需求生成、用户故事、验收条件生成 UI | M3 |
| Sprint 07 | [AI 冲突检测与分解](sprint-07-frontend-ai-conflict.md) | ✅ 完成 | 冲突检测、语义检索、任务分解 UI | M4 |
| Sprint 08 | [仪表板与集成](sprint-08-frontend-dashboard-integration.md) | ✅ 完成 | DashboardView 对接、路由整合 | M4 |
| Sprint 09 | [高级功能与优化 - 上](sprint-09-frontend-advanced-part1.md) | ✅ 完成 | 进度看板、基线管理、通知组件 | M5 |
| Sprint 10 | [高级功能与优化 - 下](sprint-10-frontend-advanced-part2.md) | ✅ 完成 | 性能优化、E2E 测试、响应式适配 | M5 |

### M6 前端开发计划

| Sprint | 名称 | 状态 | 交付内容 | 里程碑 |
|--------|------|------|----------|--------|
| Sprint 11 | [核心 Store 与页面](sprint-11-frontend-core-store.md) | 🚧 进行中 | Store 补齐、RawRequirementCollectView、UserStoryManageView | M6 |
| Sprint 12 | [组件体系](sprint-12-frontend-components.md) | ⏳ 待开始 | 通用组件库、业务组件库 | M6 |
| Sprint 13 | [体验优化](sprint-13-frontend-experience.md) | ⏳ 待开始 | 骨架屏、响应式、动画 | M6 |
| Sprint 14 | [权限与通知](sprint-15-frontend-permission.md) | ⏳ 待开始 | 权限管理、通知系统 | M6 |

详细计划: [前端路线图](frontend-roadmap.md)

---

## 里程碑进度

| 里程碑 | 目标 Sprint | 后端状态 | 前端状态 |
|--------|-------------|----------|----------|
| M0 | Sprint 0 | ✅ 完成 | ✅ 完成 |
| M1 | Sprint 2 | ✅ 完成 | ✅ 完成 |
| M2 | Sprint 4 | ✅ 完成 | ✅ 完成 |
| M3 | Sprint 6 | ✅ 完成 | ✅ 完成 |
| M4 | Sprint 8 | ✅ 完成 | ✅ 完成 |
| M5 | Sprint 10-12 | ✅ 完成 | ✅ 完成 |
| M6 | Sprint 13-15 | 🚧 进行中 | 🚧 进行中 |

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

- 2026-04-17: 新增前端 M6 开发计划 (Sprint 11-15)，Sprint 11 🚧 进行中
- 2026-04-17: Sprint 11-13 完成，M5/M6 里程碑推进
- 2026-04-17: 初始化 Sprint 索引，创建拆分文件
- 2026-04-17: 更新后端 Sprint 状态 (Sprint 01-10 ✅ 完成, Sprint 11 🚧 进行中, Sprint 12 ⏳ 待开始)
- 2026-04-17: 添加前端 Sprint 00 用户与认证管理
- 2026-04-17: 前端 Sprint 01-10 全部完成，M5 前端里程碑达成
- 2026-04-17: 新增 Sprint 13 精简 User 与角色关系重构
- 2026-04-17: 新增 Sprint 14 修复 RawRequirement 与 Requirement 关系（1:1 → 1:N）
- 2026-04-17: Sprint 14 合并到 Sprint 13，统一排期
