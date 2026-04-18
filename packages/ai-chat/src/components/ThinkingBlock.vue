<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  content: string;
  collapsed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: true,
});

const isExpanded = ref(!props.collapsed);

const toggle = () => {
  isExpanded.value = !isExpanded.value;
};
</script>

<template>
  <div v-if="content" class="thinking-block">
    <button class="thinking-toggle" @click="toggle">
      <span class="thinking-icon">{{ isExpanded ? '▼' : '▶' }}</span>
      <span class="thinking-label">思考过程</span>
    </button>
    <div v-show="isExpanded" class="thinking-content">
      {{ content }}
    </div>
  </div>
</template>

<style scoped>
.thinking-block {
  margin-bottom: 8px;
}

.thinking-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-text-color-regular, #606266);
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.thinking-toggle:hover {
  background: var(--el-fill-color, #f5f7fa);
  border-color: var(--el-border-color, #dcdfe6);
}

.thinking-icon {
  font-size: 10px;
  color: var(--el-color-info, #6366f1);
}

.thinking-label {
  font-weight: 500;
  color: var(--el-text-color-regular, #606266);
}

.thinking-content {
  margin-top: 8px;
  padding: 10px 12px;
  background: var(--el-fill-color-lightest, #fafbfc);
  border-left: 3px solid var(--el-color-info, #6366f1);
  border-radius: 0 6px 6px 0;
  font-size: 13px;
  color: var(--el-text-color-regular, #606266);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
