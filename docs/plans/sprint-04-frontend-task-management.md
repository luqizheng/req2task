# Sprint 04: 任务管理

**计划类型**: 前端开发计划
**目标**: 实现任务列表、看板视图、任务详情
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M2

---

## 1. 目标

实现任务列表、看板视图、任务详情。

---

## 2. 任务列表

| 任务 | 预估 | 优先级 | 状态 |
|------|------|--------|------|
| API: tasks.ts | 6h | P0 | ⏳ |
| Store: task.ts | 8h | P0 | ⏳ |
| TaskBoardView.vue | 12h | P0 | ⏳ |
| TaskDetailView.vue | 8h | P0 | ⏳ |
| 任务依赖组件 | 4h | P1 | ⏳ |

**总预估工时**: 38h

---

## 3. 交付物

- TaskBoardView.vue - 任务看板页面
- TaskDetailView.vue - 任务详情页面
- 任务依赖组件

---

## 4. 验收标准

- [ ] 可查看任务看板
- [ ] 可创建/编辑/删除任务
- [ ] 可拖拽更新任务状态
- [ ] 可管理任务依赖

---

## 5. 页面结构

### 5.1 TaskBoardView.vue

```
任务看板
├── 看板头部
│   ├── 需求标题
│   └── 统计信息
├── 看板列
│   ├── 待办 (Todo)
│   │   └── TaskCard 列表
│   ├── 进行中 (In Progress)
│   │   └── TaskCard 列表
│   ├── 代码审查 (Code Review)
│   │   └── TaskCard 列表
│   ├── 测试 (Testing)
│   │   └── TaskCard 列表
│   └── 完成 (Done)
│       └── TaskCard 列表
└── 创建任务按钮
```

### 5.2 TaskDetailView.vue

```
任务详情
├── 任务信息区
│   ├── 任务编号
│   ├── 任务标题
│   ├── 描述
│   ├── 状态
│   └── 优先级
├── 分配信息区
│   ├── 负责人
│   └── 预计工时
├── 依赖关系区
│   └── DependencyGraph
├── 子任务区
│   └── SubTaskList
└── 活动记录
    └── ActivityLog
```

---

## 6. 组件清单

| 组件 | 说明 |
|------|------|
| TaskCard | 任务卡片组件 |
| TaskForm | 任务表单组件 |
| KanbanColumn | 看板列组件 |
| DependencyGraph | 依赖关系图组件 |

---

## 7. 路由配置

```typescript
{
  path: '/requirements/:requirementId/tasks',
  name: 'TaskBoardView',
  component: TaskBoardView
},
{
  path: '/tasks/:id',
  name: 'TaskDetailView',
  component: TaskDetailView
}
```

---

## 8. API 设计

```typescript
// API 调用层
GET    /requirements/:requirementId/tasks           // 按需求列表
GET    /requirements/:requirementId/kanban          // 看板视图
GET    /requirements/:requirementId/task-statistics // 任务统计
GET    /tasks/:id                                    // 详情
POST   /requirements/:requirementId/tasks            // 创建
PUT    /tasks/:id                                    // 更新
DELETE /tasks/:id                                    // 删除
POST   /tasks/:id/transition                        // 状态流转
GET    /tasks/:id/allowed-transitions               // 允许的状态
POST   /tasks/:id/dependencies                      // 添加依赖
DELETE /tasks/:id/dependencies/:dependencyTaskId    // 移除依赖
```

---

## 9. 拖拽实现

使用 `@vueuse/core` 的 `useDraggable` 或 `vuedraggable` 库实现看板拖拽功能。

---

## 10. 依赖关系

- **前置条件**: Sprint 3 需求状态与工作流完成
- **后续 Sprint**: Sprint 5 需要任务管理 API

---

## 11. 完成标准

- [ ] 看板视图功能完整
- [ ] 拖拽更新状态正常
- [ ] 任务详情页面展示正确
- [ ] 依赖关系展示清晰

---

**上一 Sprint**: [Sprint 03: 需求状态与工作流](sprint-03-frontend-requirements-workflow.md)
**下一 Sprint**: [Sprint 05: AI 配置与对话](sprint-05-frontend-ai-chat.md)
