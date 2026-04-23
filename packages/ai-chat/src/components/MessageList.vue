<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { AIChatMessage } from '../types';

interface Props {
  messages: AIChatMessage[];
  autoScroll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoScroll: true,
});

const emit = defineEmits<{
  (e: 'load-more'): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const isLoadingMore = ref(false);

function scrollToBottom() {
  if (!props.autoScroll) return;
  nextTick(() => {
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight;
    }
  });
}

function handleScroll() {
  if (!containerRef.value) return;

  const { scrollTop } = containerRef.value;

  if (scrollTop === 0 && !isLoadingMore.value && props.messages.length > 0) {
    isLoadingMore.value = true;
    emit('load-more');
    setTimeout(() => {
      isLoadingMore.value = false;
    }, 1000);
  }
}

watch(
  () => props.messages.length,
  () => {
    scrollToBottom();
  },
);

watch(
  () => props.messages,
  () => {
    scrollToBottom();
  },
  { deep: true },
);

defineExpose({
  scrollToBottom,
});
</script>

<template>
  <div
    ref="containerRef"
    class="message-list"
    @scroll="handleScroll"
  >
    <div v-if="isLoadingMore" class="loading-indicator">
      <span>加载更多...</span>
    </div>
    <slot></slot>
  </div>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  scroll-behavior: smooth;
  background: var(--el-fill-color-lightest, #ffffff);
}

.message-list::-webkit-scrollbar {
  width: 5px;
}

.message-list::-webkit-scrollbar-track {
  background: transparent;
}

.message-list::-webkit-scrollbar-thumb {
  background: var(--el-border-color-lighter, #e4e7ed);
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color, #dcdfe6);
}

.loading-indicator {
  text-align: center;
  padding: 12px;
  color: var(--el-text-color-placeholder, #a0aec0);
  font-size: 13px;
}
</style>
