# Sprint 05: 任务管理

**计划类型**: 后端实施路线图
**目标**: 完成任务 CRUD、任务依赖管理、任务分配
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M2

---

## 1. 目标

- 完成任务 CRUD
- 任务依赖管理
- 任务分配

---

## 2. 任务列表

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| Task Entity 开发 | dev | 6h | P0 | ⏳ |
| TaskService 开发 | dev | 8h | P0 | ⏳ |
| TaskController 开发 | dev | 6h | P0 | ⏳ |
| TaskDependency Entity | dev | 4h | P0 | ⏳ |
| 任务编号生成器 | dev | 6h | P0 | ⏳ |
| 任务依赖服务 | dev | 6h | P0 | ⏳ |
| 任务分配服务 | dev | 6h | P0 | ⏳ |
| 数据库迁移脚本 | dev | 4h | P0 | ⏳ |

**总预估工时**: 46h

---

## 3. 交付物

- Task 模块完整 API
- 任务依赖管理
- 任务分配

---

## 4. 验收标准

- [ ] 可创建任务并关联需求
- [ ] 任务编号自动生成
- [ ] 可建立任务依赖关系
- [ ] 可分配任务给用户/AI

---

## 5. API 设计

### 5.1 Task API

```typescript
// 后端接口
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

## 6. 任务编号规则

```
{项目前缀}-{需求ID}-{序号}
例如: PRJ-REQ001-001
```

---

## 7. 依赖关系

- **前置条件**: Sprint 4 需求状态与变更完成
- **后续 Sprint**: Sprint 6 需要任务管理功能

---

## 8. 完成标准

- [ ] 所有 API 接口正常工作
- [ ] 任务编号生成规则正确
- [ ] 依赖关系可正常建立
- [ ] 单元测试覆盖率 ≥ 70%

---

**上一 Sprint**: [Sprint 04: 需求状态与变更](sprint-04-implementation-requirements-workflow.md)
**下一 Sprint**: [Sprint 06: 任务状态与看板](sprint-06-implementation-task-board.md)
