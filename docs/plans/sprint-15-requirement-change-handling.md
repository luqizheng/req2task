# Sprint 15: 需求变更处理 - 已完成任务管理

**计划类型**: 后端实施路线图 + 前端开发计划
**目标**: 实现需求变更时已完成任务的处理机制（替代/废弃/工时统计）
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M6

---

## 1. 目标

- 支持已完成后任务的"被替代"状态及双向关联
- 支持需求取消时任务的自动废弃及浪费工时统计
- 提供完整的工时统计视图（有效/返工/浪费）

---

## 2. 后端任务列表

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| Task 模型扩展 `replaced` 状态 | dev | 2h | P0 | ⏳ |
| 变更影响评估服务增强（检测已完成任务冲突） | dev | 6h | P0 | ⏳ |
| 任务替代关联 API（双向 relates_to） | dev | 4h | P0 | ⏳ |
| 任务废弃 API（含 cancelledReason） | dev | 2h | P0 | ⏳ |
| 工时统计 API（有效/返工/浪费） | dev | 4h | P1 | ⏳ |
| 变更流程集成（触发替代/废弃逻辑） | dev | 4h | P0 | ⏳ |

**后端预估工时**: 22h

---

## 3. 前端任务列表

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| 任务状态筛选增加 `replaced` 选项 | dev | 2h | P0 | ⏳ |
| 看板支持 `replaced` 状态卡片展示 | dev | 4h | P0 | ⏳ |
| 任务详情页 - 关联任务展示 | dev | 4h | P0 | ⏳ |
| 任务替代操作 UI（选择替代任务） | dev | 4h | P0 | ⏳ |
| 任务废弃操作 UI（含废弃原因） | dev | 2h | P0 | ⏳ |
| 工时统计面板（饼图：有效/返工/浪费） | dev | 6h | P1 | ⏳ |

**前端预估工时**: 22h

---

## 4. 交付物

- Task 模型支持 `replaced` 状态
- 任务替代/废弃操作完整流程
- 双向任务关联展示
- 工时统计面板

---

## 5. 验收标准

- [ ] 已完成任务可标记为"被替代"并创建新任务
- [ ] 被替代任务与新任务可双向关联查看
- [ ] 需求取消时关联任务自动标记废弃并记录原因
- [ ] 工时统计可区分有效工时、返工工时、浪费工时

---

## 6. API 设计

### 6.1 标记任务被替代

```http
POST /api/tasks/:id/mark-replaced
```

**请求**
```json
{
  "replacedByTaskId": "uuid",
  "reason": "需求变更，供应商更换"
}
```

### 6.2 获取替代任务列表

```http
GET /api/tasks/:id/replaced-tasks
```

### 6.3 工时统计

```http
GET /api/projects/:id/workload-stats
```

**响应**
```json
{
  "code": 0,
  "data": {
    "effectiveHours": 120,
    "reworkHours": 16,
    "wastedHours": 8,
    "totalHours": 144
  }
}
```

---

## 7. 技术说明

### 7.1 任务状态流转

```
新增: replaced（被替代）
- 从 done → replaced（手动触发替代操作）
- replaced 状态的任务仍计入总工时，但标记为"返工"
```

### 7.2 关联关系

```
TaskDependency 支持双向 relates_to
- prerequisiteTaskId: 被替代的任务
- dependentTaskId: 替代的新任务
```

---

**上一 Sprint**: [Sprint 14](sprint-14-fix-raw-requirement-relation.md)
