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
  background: #fafbfc;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.window-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.window-title {
  font-size: 15px;
  font-weight: 600;
}

.window-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
