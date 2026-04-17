# Sprint 12: 组件体系

**计划类型**: 前端开发
**目标**: 建立通用组件库和业务组件
**预计时长**: 1 周 (约 4.5 人天)
**状态**: ⏳ 待开始
**里程碑**: M6

---

## 1. 目标

- 建立 `src/components/common/` 通用组件库
- 建立 `src/components/business/` 业务组件库
- 编写组件文档

---

## 2. 任务列表

### 2.1 通用组件

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| AppButton 扩展 | component | 2h | P1 | ⏳ |
| AppCard 封装 | component | 2h | P1 | ⏳ |
| AppTable 封装 | component | 4h | P1 | ⏳ |
| AppForm 封装 | component | 4h | P1 | ⏳ |
| AppModal 封装 | component | 2h | P1 | ⏳ |
| AppTag 扩展 | component | 2h | P1 | ⏳ |
| AppBadge | component | 2h | P2 | ⏳ |
| AppAvatar | component | 1h | P2 | ⏳ |
| AppEmpty 空状态 | component | 2h | P1 | ⏳ |
| AppLoading 加载态 | component | 2h | P1 | ⏳ |
| AppPagination 分页 | component | 2h | P1 | ⏳ |

### 2.2 业务组件

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| RequirementCard | component | 4h | P1 | ⏳ |
| TaskCard | component | 4h | P1 | ⏳ |
| MemberSelect | component | 3h | P1 | ⏳ |
| PriorityTag | component | 2h | P1 | ⏳ |
| StatusTag 状态标签 | component | 2h | P1 | ⏳ |
| ProgressBar | component | 2h | P2 | ⏳ |

### 2.3 文档与工具

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| 组件使用文档 | docs | 4h | P2 | ⏳ |
| Storybook 配置 (可选) | tool | 4h | P3 | ⏳ |

**总预估工时**: 36h

---

## 3. 组件设计

### 3.1 目录结构

```
src/components/
├── common/                    # 通用组件
│   ├── AppButton.vue          # 按钮
│   ├── AppCard.vue            # 卡片
│   ├── AppTable.vue           # 表格封装
│   ├── AppForm.vue            # 表单封装
│   ├── AppModal.vue           # 模态框
│   ├── AppTag.vue             # 标签
│   ├── AppBadge.vue           # 徽章
│   ├── AppAvatar.vue          # 头像
│   ├── AppEmpty.vue           # 空状态
│   ├── AppLoading.vue         # 加载态
│   ├── AppPagination.vue      # 分页
│   └── index.ts               # 导出
├── business/                  # 业务组件
│   ├── RequirementCard.vue    # 需求卡片
│   ├── TaskCard.vue           # 任务卡片
│   ├── MemberSelect.vue       # 成员选择
│   ├── PriorityTag.vue        # 优先级标签
│   ├── StatusTag.vue          # 状态标签
│   ├── ProgressBar.vue        # 进度条
│   └── index.ts               # 导出
└── layout/                   # 布局组件 (已有)
    └── MainLayout.vue
```

### 3.2 组件示例

**AppButton.vue**
```vue
<script setup lang="ts">
defineProps<{
  type?: 'primary' | 'default' | 'danger' | 'success'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
}>()
</script>

<template>
  <el-button
    :type="type"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    class="app-button"
  >
    <slot />
  </el-button>
</template>

<style scoped>
.app-button {
  /* 扩展样式 */
}
</style>
```

**RequirementCard.vue**
```vue
<script setup lang="ts">
import { computed } from 'vue'
import PriorityTag from './PriorityTag.vue'
import StatusTag from './StatusTag.vue'

const props = defineProps<{
  requirement: {
    id: string
    title: string
    priority: string
    status: string
    estimatedManDays?: number
  }
}>()

const emit = defineEmits<{
  click: [id: string]
  edit: [id: string]
}>()
</script>

<template>
  <el-card 
    class="requirement-card" 
    shadow="hover"
    @click="emit('click', requirement.id)"
  >
    <div class="card-header">
      <h4 class="title">{{ requirement.title }}</h4>
      <div class="tags">
        <PriorityTag :priority="requirement.priority" />
        <StatusTag :status="requirement.status" />
      </div>
    </div>
    <div class="card-body">
      <span v-if="requirement.estimatedManDays">
        预估: {{ requirement.estimatedManDays }} 人天
      </span>
    </div>
    <div class="card-footer">
      <el-button link @click.stop="emit('edit', requirement.id)">
        编辑
      </el-button>
    </div>
  </el-card>
</template>
```

**PriorityTag.vue**
```vue
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  priority: string
}>()

const priorityConfig = computed(() => {
  const config: Record<string, { label: string; type: string }> = {
    critical: { label: '紧急', type: 'danger' },
    high: { label: '高', type: 'warning' },
    medium: { label: '中', type: 'info' },
    low: { label: '低', type: 'success' }
  }
  return config[props.priority] || { label: props.priority, type: 'info' }
})
</script>

<template>
  <el-tag :type="priorityConfig.type" size="small">
    {{ priorityConfig.label }}
  </el-tag>
</template>
```

### 3.3 AppTable 封装

```vue
<!-- AppTable.vue -->
<script setup lang="ts">
defineProps<{
  data: any[]
  columns: TableColumn[]
  loading?: boolean
  pagination?: boolean
  total?: number
  page?: number
  pageSize?: number
}>()

const emit = defineEmits<{
  pageChange: [page: number]
  pageSizeChange: [size: number]
}>()
</script>

<template>
  <div class="app-table">
    <el-table :data="data" :loading="loading" stripe>
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :fixed="col.fixed"
      >
        <template v-if="col.slot" #default="{ row }">
          <slot :name="col.slot" :row="row" />
        </template>
      </el-table-column>
    </el-table>
    
    <el-pagination
      v-if="pagination"
      :total="total"
      :current-page="page"
      :page-size="pageSize"
      @current-change="emit('pageChange', $event)"
      @size-change="emit('pageSizeChange', $event)"
    />
  </div>
</template>
```

### 3.4 AppEmpty 空状态

```vue
<!-- AppEmpty.vue -->
<script setup lang="ts">
defineProps<{
  icon?: string
  description?: string
  actionText?: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="app-empty">
    <el-icon class="empty-icon" :size="64">
      <component :is="icon || 'DocumentDelete'" />
    </el-icon>
    <p class="empty-description">
      {{ description || '暂无数据' }}
    </p>
    <el-button
      v-if="actionText"
      type="primary"
      @click="emit('action')"
    >
      {{ actionText }}
    </el-button>
  </div>
</template>
```

---

## 4. 验收标准

- [ ] 通用组件库可复用
- [ ] 业务组件覆盖核心场景
- [ ] 组件通过 Storybook 可视化 (可选)
- [ ] 组件文档完整

---

## 5. 依赖关系

```
Sprint 11: Store 与页面
    │
    ▼
Sprint 12: 组件体系
    │
    ▼
Sprint 13: 体验优化
```

---

## 6. 后续规划

- Sprint 13: 体验优化 (骨架屏、响应式、动画)
- Sprint 14: 权限与通知

---

**上一步**: [Sprint 11: 核心 Store 与页面](sprint-11-frontend-core-store.md)
**下一步**: [Sprint 13: 体验优化](sprint-13-frontend-experience.md)
