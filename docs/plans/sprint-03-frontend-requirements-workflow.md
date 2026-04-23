# Sprint 03: 需求状态与工作流

**计划类型**: 前端开发计划
**目标**: 实现需求状态流转、变更历史、评审功能
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M2

---

## 1. 目标

实现需求状态流转、变更历史、评审功能。

---

## 2. 任务列表

| 任务 | 预估 | 优先级 | 状态 |
|------|------|--------|------|
| 需求状态流转组件 | 6h | P0 | ⏳ |
| 变更历史展示组件 | 4h | P0 | ⏳ |
| 需求评审组件 | 4h | P0 | ⏳ |
| 需求详情页面完善 | 6h | P0 | ⏳ |
| Store: requirement.ts 完善 | 4h | P1 | ⏳ |

**总预估工时**: 24h

---

## 3. 交付物

- 状态流转组件
- 变更历史展示组件
- 评审组件

---

## 4. 验收标准

- [ ] 可流转需求状态
- [ ] 可查看变更历史
- [ ] 可进行需求评审

---

## 5. 组件设计

### 5.1 StatusTransition 组件

```vue
<template>
  <div class="status-transition">
    <div class="current-status">
      当前状态: <StatusTag :status="currentStatus" />
    </div>
    <div class="transition-buttons">
      <el-button
        v-for="transition in allowedTransitions"
        :key="transition.to"
        @click="handleTransition(transition)"
      >
        {{ transition.label }}
      </el-button>
    </div>
  </div>
</template>
```

### 5.2 ChangeHistory 组件

```vue
<template>
  <div class="change-history">
    <el-timeline>
      <el-timeline-item
        v-for="log in changeLogs"
        :key="log.id"
        :timestamp="log.timestamp"
      >
        <div class="log-content">
          <span class="user">{{ log.userName }}</span>
          <span class="action">{{ log.action }}</span>
          <span class="detail">{{ log.detail }}</span>
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>
```

### 5.3 评审组件

```vue
<template>
  <div class="review-panel">
    <div class="review-form">
      <el-input
        v-model="reviewComment"
        type="textarea"
        placeholder="评审意见"
      />
      <div class="review-actions">
        <el-button type="success" @click="approve">
          通过
        </el-button>
        <el-button type="danger" @click="reject">
          拒绝
        </el-button>
      </div>
    </div>
  </div>
</template>
```

---

## 6. 需求状态流转

```
草稿(Draft) → 待评审(Pending Review) → 评审中(In Review) → 通过(Approved) / 拒绝(Rejected)
                    ↑                                              ↓
                    └──────────────────────────────────────────────┘
                              (拒绝后可返回草稿重新编辑)
```

---

## 7. API 设计

```typescript
// 状态流转
POST   /requirements/:id/transition                  // 状态流转
GET    /requirements/:id/allowed-transitions         // 允许的状态

// 变更历史
GET    /requirements/:id/change-history              // 变更历史

// 评审
POST   /requirements/:id/review                      // 评审
```

---

## 8. 依赖关系

- **前置条件**: Sprint 2 需求管理基础完成
- **后续 Sprint**: Sprint 4 需要状态管理

---

## 9. 完成标准

- [ ] 状态流转组件功能完整
- [ ] 变更历史正确展示
- [ ] 评审流程可正常执行

---

**上一 Sprint**: [Sprint 02: 需求管理基础](sprint-02-frontend-requirements-basics.md)
**下一 Sprint**: [Sprint 04: 任务管理](sprint-04-frontend-task-management.md)
