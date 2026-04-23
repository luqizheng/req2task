<script setup lang="ts">
interface Props {
  title?: string;
  maxHeight?: string;
  showHeader?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: 'AI 助手',
  maxHeight: '600px',
  showHeader: true,
});
</script>

<template>
  <div class="ai-chat-window" :style="{ maxHeight }">
    <header v-if="showHeader" class="window-header">
      <slot name="header">
        <span class="window-title">{{ title }}</span>
      </slot>
    </header>
    <div class="window-body">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.ai-chat-window {
  display: flex;
  flex-direction: column;
  background: var(--el-fill-color-lightest, #f5f7fa);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.window-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--el-color-info-light-9, #f4f4f5);
  border-bottom: 1px solid var(--el-border-color-lighter, #e4e7ed);
  color: var(--el-text-color-primary, #303133);
}

.window-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}

.window-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
