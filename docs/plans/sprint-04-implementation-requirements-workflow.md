# Sprint 04: 需求状态与变更

**计划类型**: 后端实施路线图
**目标**: 需求状态机实现、变更日志记录、需求审批流程
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M2

---

## 1. 目标

- 需求状态机实现
- 变更日志记录
- 需求审批流程

---

## 2. 任务列表

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| 需求状态流转服务 | dev | 8h | P0 | ⏳ |
| 状态变更触发器 | dev | 6h | P0 | ⏳ |
| RequirementChangeLog Entity | dev | 4h | P0 | ⏳ |
| 变更日志服务 | dev | 6h | P0 | ⏳ |
| 需求评审 API | dev | 6h | P1 | ⏳ |
| 需求版本管理基础 | dev | 6h | P1 | ⏳ |
| 数据库迁移脚本 | dev | 4h | P0 | ⏳ |

**总预估工时**: 40h

---

## 3. 交付物

- 需求状态机
- 变更日志记录
- 评审流程

---

## 4. 验收标准

- [ ] 需求状态可正常流转
- [ ] 状态变更自动记录日志
- [ ] 可查看需求变更历史
- [ ] 支持需求评审（approve/reject）

---

## 5. API 设计

### 5.1 状态流转 API

```typescript
// 后端接口
POST   /requirements/:id/transition                  // 状态流转
GET    /requirements/:id/allowed-transitions         // 允许的状态
```

### 5.2 变更历史 API

```typescript
// 后端接口
GET    /requirements/:id/change-history              // 变更历史
```

### 5.3 评审 API

```typescript
// 后端接口
POST   /requirements/:id/review                      // 评审
```

---

## 6. 需求状态

```
草稿(Draft) → 待评审(Pending Review) → 评审中(In Review) → 通过(Approved) / 拒绝(Rejected)
                    ↑                                              ↓
                    └──────────────────────────────────────────────┘
                              (拒绝后可返回草稿重新编辑)
```

---

## 7. 依赖关系

- **前置条件**: Sprint 3 需求管理基础完成
- **后续 Sprint**: Sprint 5 需要需求状态功能

---

## 8. 完成标准

- [ ] 状态流转规则正确实现
- [ ] 变更日志完整记录
- [ ] 评审流程可正常执行
- [ ] 单元测试覆盖率 ≥ 70%

---

**上一 Sprint**: [Sprint 03: 需求管理基础](sprint-03-implementation-requirements-basics.md)
**下一 Sprint**: [Sprint 05: 任务管理](sprint-05-implementation-task-management.md)
