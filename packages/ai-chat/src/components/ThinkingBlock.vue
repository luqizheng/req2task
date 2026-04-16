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
  padding: 4px 8px;
  border: none;
  background: #f0f0f0;
  color: #666;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.thinking-toggle:hover {
  background: #e0e0e0;
}

.thinking-icon {
  font-size: 10px;
}

.thinking-label {
  font-weight: 500;
}

.thinking-content {
  margin-top: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-left: 3px solid #667eea;
  border-radius: 0 4px 4px 0;
  font-size: 13px;
  color: #4a4a5a;
  line-height: 1.6;
  font-style: italic;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
