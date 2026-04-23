# Sprint 06: 任务状态与看板

**计划类型**: 后端实施路线图
**目标**: 任务状态机实现、看板视图 API、任务统计
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M2

---

## 1. 目标

- 任务状态机实现
- 看板视图 API
- 任务统计

---

## 2. 任务列表

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| 任务状态流转服务 | dev | 6h | P0 | ⏳ |
| 任务状态更新 API | dev | 4h | P0 | ⏳ |
| 看板视图服务 | dev | 8h | P0 | ⏳ |
| 任务统计服务 | dev | 6h | P1 | ⏳ |
| 子任务支持 | dev | 6h | P1 | ⏳ |
| 前端看板页面 | dev | 8h | P0 | ⏳ |
| 数据库迁移脚本 | dev | 4h | P0 | ⏳ |

**总预估工时**: 42h

---

## 3. 交付物

- 任务看板 API
- 任务统计
- 前端看板页面

---

## 4. 验收标准

- [ ] 任务状态可正常流转
- [ ] 看板视图展示任务
- [ ] 可查看任务统计

---

## 5. 看板视图数据格式

```typescript
interface KanbanView {
  columns: KanbanColumn[]
  totalTasks: number
  statistics: TaskStatistics
}

interface KanbanColumn {
  status: TaskStatus
  tasks: Task[]
  count: number
}

interface TaskStatistics {
  total: number
  completed: number
  inProgress: number
  blocked: number
  overdue: number
}
```

---

## 6. 任务状态

```
待办(Todo) → 进行中(In Progress) → 代码审查(Code Review) → 测试(Testing) → 完成(Done)
                 ↓                                              ↑
                 └───────────── 阻塞(Blocked) ─────────────────┘
```

---

## 7. 依赖关系

- **前置条件**: Sprint 5 任务管理完成
- **后续 Sprint**: Sprint 7 需要看板视图 API

---

## 8. 完成标准

- [ ] 状态流转规则正确实现
- [ ] 看板视图数据格式正确
- [ ] 统计接口返回准确
- [ ] 单元测试覆盖率 ≥ 70%

---

**上一 Sprint**: [Sprint 05: 任务管理](sprint-05-implementation-task-management.md)
**下一 Sprint**: [Sprint 07: AI 基础设施](sprint-07-implementation-ai-infrastructure.md)
