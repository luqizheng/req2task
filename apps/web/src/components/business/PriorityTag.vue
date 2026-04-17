<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  priority: string;
  size?: 'small' | 'default' | 'large';
}>();

const priorityConfig = computed(() => {
  const config: Record<string, { label: string; type: 'danger' | 'warning' | 'info' | 'success' }> = {
    critical: { label: '紧急', type: 'danger' },
    high: { label: '高', type: 'warning' },
    medium: { label: '中', type: 'info' },
    low: { label: '低', type: 'success' }
  };
  return config[props.priority?.toLowerCase()] || { label: props.priority, type: 'info' as const };
});
</script>

<template>
  <el-tag :type="priorityConfig.type" :size="size || 'small'" class="priority-tag">
    {{ priorityConfig.label }}
  </el-tag>
</template>

<style scoped>
.priority-tag {
  border-radius: 4px;
  font-weight: 500;
}
</style>
