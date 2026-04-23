# Sprint 07: AI 冲突检测与分解

**计划类型**: 前端开发计划
**目标**: 实现冲突检测、任务分解、相似推荐
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M4

---

## 1. 目标

实现冲突检测、任务分解、相似推荐。

---

## 2. 任务列表

| 任务 | 预估 | 优先级 | 状态 |
|------|------|--------|------|
| 冲突检测展示组件 | 6h | P0 | ⏳ |
| 语义检索结果组件 | 4h | P0 | ⏳ |
| 任务分解展示 | 6h | P0 | ⏳ |
| 相似需求推荐 | 4h | P0 | ⏳ |
| RequirementChatView.vue | 8h | P0 | ⏳ |

**总预估工时**: 28h

---

## 3. 交付物

- 冲突检测展示组件
- 语义检索结果组件
- 任务分解展示组件
- 相似需求推荐组件
- RequirementChatView.vue - 需求对话页面

---

## 4. 验收标准

- [ ] 可检测需求冲突
- [ ] 可查看相似需求
- [ ] 可 AI 分解任务
- [ ] 需求对话界面正常

---

## 5. 页面结构

### 5.1 RequirementChatView.vue

```
需求对话页面
├── 左侧面板
│   ├── 需求信息
│   ├── 相似需求推荐
│   └── 冲突检测结果
└── 右侧面板
    └── AI Chat 组件
```

---

## 6. 组件设计

### 6.1 冲突检测展示组件

```vue
<template>
  <div class="conflict-result">
    <div class="conflict-type">
      <el-tag :type="getTypeColor(conflict.type)">
        {{ conflict.type }}
      </el-tag>
    </div>
    <div class="conflict-details">
      <h4>涉及需求</h4>
      <div class="related-requirements">
        <RequirementCard
          v-for="req in conflict.relatedRequirements"
          :key="req.id"
          :requirement="req"
        />
      </div>
    </div>
    <div class="conflict-suggestion">
      <h4>建议</h4>
      <p>{{ conflict.suggestion }}</p>
    </div>
  </div>
</template>
```

### 6.2 相似需求推荐组件

```vue
<template>
  <div class="similar-list">
    <h4>相似需求</h4>
    <div class="similar-items">
      <div
        v-for="item in similarRequirements"
        :key="item.id"
        class="similar-item"
      >
        <RequirementCard :requirement="item" />
        <div class="similarity-score">
          相似度: {{ (item.similarity * 100).toFixed(0) }}%
        </div>
      </div>
    </div>
  </div>
</template>
```

### 6.3 任务分解展示组件

```vue
<template>
  <div class="task-decomposition">
    <h4>任务分解</h4>
    <el-tree
      :data="decomposedTasks"
      :props="treeProps"
      default-expand-all
    >
      <template #default="{ node, data }">
        <span class="task-node">
          <span class="task-name">{{ data.name }}</span>
          <span class="task-estimate">{{ data.estimate }}h</span>
        </span>
      </template>
    </el-tree>
  </div>
</template>
```

---

## 7. API 设计

```typescript
// 冲突检测
POST   /ai/raw-requirements/:id/detect-conflicts       // 检测冲突

// 语义检索
GET    /ai/semantic-search                              // 语义检索

// 相似推荐
GET    /ai/similar-requirements                         // 相似需求

// 任务分解
POST   /ai/decompose-requirement                        // 分解需求
POST   /ai/tasks/:id/generate-subtasks                  // 生成子任务
```

---

## 8. 冲突类型展示

| 冲突类型 | 颜色 | 图标 |
|----------|------|------|
| 逻辑冲突 | danger | ⚠️ |
| 依赖冲突 | warning | 🔗 |
| 重复冲突 | info | 📋 |
| 优先级冲突 | primary | ⭐ |

---

## 9. 依赖关系

- **前置条件**: Sprint 6 AI 需求生成完成
- **后续 Sprint**: Sprint 8 需要对话界面

---

## 10. 完成标准

- [ ] 冲突检测组件功能完整
- [ ] 相似需求推荐展示正确
- [ ] 任务分解结果展示清晰
- [ ] 需求对话界面正常

---

**上一 Sprint**: [Sprint 06: AI 需求生成](sprint-06-frontend-ai-requirement-gen.md)
**下一 Sprint**: [Sprint 08: 仪表板与集成](sprint-08-frontend-dashboard-integration.md)
