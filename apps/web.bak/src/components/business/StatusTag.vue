<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: string;
  size?: 'small' | 'default' | 'large';
}>();

const statusConfig = computed(() => {
  const config: Record<string, { label: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
    draft: { label: '草稿', type: 'info' },
    pending: { label: '待评审', type: 'warning' },
    reviewing: { label: '评审中', type: 'primary' },
    approved: { label: '已通过', type: 'success' },
    rejected: { label: '已拒绝', type: 'danger' },
    active: { label: '进行中', type: 'primary' },
    completed: { label: '已完成', type: 'success' },
    paused: { label: '已暂停', type: 'warning' },
    cancelled: { label: '已取消', type: 'danger' },
    todo: { label: '待处理', type: 'info' },
    doing: { label: '进行中', type: 'primary' },
    done: { label: '已完成', type: 'success' }
  };
  return config[props.status?.toLowerCase()] || { label: props.status, type: 'info' as const };
});
</script>

<template>
  <el-tag :type="statusConfig.type" :size="size || 'small'" class="status-tag">
    {{ statusConfig.label }}
  </el-tag>
</template>

<style scoped>
.status-tag {
  border-radius: 4px;
  font-weight: 500;
}
</style>
