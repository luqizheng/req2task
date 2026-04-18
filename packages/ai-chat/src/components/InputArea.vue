<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '输入消息，AI 将实时响应...',
  disabled: false,
  maxLength: 4000,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'send', content: string): void;
}>();

const inputValue = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
});

const canSend = computed(() => {
  return inputValue.value.trim().length > 0 && !props.disabled;
});

function handleSend() {
  if (!canSend.value) return;
  emit('send', inputValue.value.trim());
  inputValue.value = '';
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
}
</script>

<template>
  <div class="input-area">
    <div class="input-wrapper">
      <textarea
        v-model="inputValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxLength"
        class="input-textarea"
        rows="1"
        @keydown="handleKeydown"
      ></textarea>
      <button
        class="send-button"
        :disabled="!canSend"
        @click="handleSend"
      >
        <svg
          v-if="!disabled"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
        <svg
          v-else
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
        </svg>
      </button>
    </div>
    <div v-if="maxLength" class="input-footer">
      <span class="char-count">
        {{ inputValue.length }} / {{ maxLength }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.input-area {
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter, #e4e7ed);
  background: var(--el-fill-color-lightest, #ffffff);
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.input-textarea {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
  background: var(--el-fill-color, #f5f7fa);
  color: var(--el-text-color-primary, #303133);
}

.input-textarea:focus {
  border-color: var(--el-color-primary, #2563eb);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.input-textarea:disabled {
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-text-color-placeholder, #a0aec0);
  cursor: not-allowed;
}

.input-textarea::placeholder {
  color: var(--el-text-color-placeholder, #a0aec0);
}

.send-button {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: var(--el-color-primary, #2563eb);
  color: white;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.15s;
}

.send-button:hover:not(:disabled) {
  background: var(--el-color-primary-light-1, #3b82f6);
}

.send-button:active:not(:disabled) {
  background: var(--el-color-primary-dark, #1d4ed8);
  transform: scale(0.96);
}

.send-button:disabled {
  background: var(--el-fill-color-dark, #c0c4cc);
  cursor: not-allowed;
}

.input-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.char-count {
  font-size: 11px;
  color: var(--el-text-color-placeholder, #a0aec0);
}
</style>
