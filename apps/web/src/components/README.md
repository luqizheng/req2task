# Components

## 公共组件

### ProjectStatusSelect

项目状态选择组件，支持单选状态过滤。

**位置**: `src/components/ProjectStatusSelect.vue`

**Props**:

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string` | `''` | 当前选中的状态值 |
| `options` | `StatusOption[]` | 内置选项 | 自定义选项列表 |

**StatusOption 类型**:

```typescript
interface StatusOption {
  value: string;
  label: string;
}
```

**Events**:

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `value: string` | 选中值变化时触发，返回空字符串表示"全部" |

**使用示例**:

```vue
<script setup>
import { ref } from 'vue';
import ProjectStatusSelect from '@/components/ProjectStatusSelect.vue';

const status = ref('');
</script>

<template>
  <ProjectStatusSelect v-model="status" />
</template>
```

**内置状态选项**:

| value | label |
|-------|-------|
| `planning` | 规划中 |
| `active` | 进行中 |
| `on_hold` | 暂停 |
| `completed` | 已完成 |
| `archived` | 已归档 |


