<script setup lang="ts">
import { computed } from 'vue';

type ConflictLevel = 'critical' | 'high' | 'medium' | 'low';

const props = withDefaults(defineProps<{
  level?: ConflictLevel;
  size?: 'small' | 'default' | 'large';
}>(), {
  level: 'medium',
  size: 'default',
});

const levelConfig = computed(() => {
  const configs: Record<ConflictLevel, { label: string; color: string; bgColor: string }> = {
    critical: { label: '严重', color: '#721c24', bgColor: '#f8d7da' },
    high: { label: '高', color: '#856404', bgColor: '#fff3cd' },
    medium: { label: '中', color: '#0c5460', bgColor: '#d1ecf1' },
    low: { label: '低', color: '#155724', bgColor: '#d4edda' },
  };
  return configs[props.level];
});
</script>

<template>
  <span
    :class="['conflict-badge', `size-${size}`]"
    :style="{
      color: levelConfig.color,
      backgroundColor: levelConfig.bgColor,
    }"
  >
    <span class="badge-icon">⚠️</span>
    <span class="badge-text">{{ levelConfig.label }}</span>
  </span>
</template>

<style scoped>
.conflict-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.size-small {
  padding: 1px 6px;
  font-size: 11px;
}

.size-small .badge-icon {
  font-size: 10px;
}

.size-large {
  padding: 4px 12px;
  font-size: 14px;
}

.badge-icon {
  font-size: 12px;
}

.badge-text {
  line-height: 1;
}
</style>
