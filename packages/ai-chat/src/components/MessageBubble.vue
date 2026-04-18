<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AIChatMessage, MessageRole } from '../types';
import ThinkingBlock from './ThinkingBlock.vue';
import { useMarkdown } from '../composables/useMarkdown';

interface Props {
  message: AIChatMessage;
}

interface Emits {
  (e: 'delete', id: string): void;
  (e: 'resend', id: string): void;
  (e: 'retry'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isUser = computed(() => props.message.role === 'user');
const isAssistant = computed(() => props.message.role === 'assistant');
const isSystem = computed(() => props.message.role === 'system');

const displayRoleName = computed(() => {
  return props.message.roleName || getDefaultRoleName(props.message.role);
});

const displayAvatar = computed(() => {
  if (props.message.avatar) {
    return props.message.avatar;
  }
  return getDefaultAvatar(props.message.role);
});

const { renderWithThinking } = useMarkdown();

const renderedContent = computed(() => {
  if (!props.message.content) {
    return { html: '', thinkingProcess: '' };
  }
  return renderWithThinking(props.message.content);
});

const isStreaming = computed(() => props.message.status === 'streaming');
const isSending = computed(() => props.message.status === 'sending');
const isError = computed(() => props.message.status === 'error');

const showActions = ref(false);

const timeFormat = computed(() => {
  if (!props.message.createdAt) return '';
  const date = new Date(props.message.createdAt);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
});

function getDefaultRoleName(role: MessageRole): string {
  const names: Record<MessageRole, string> = {
    user: '用户',
    assistant: 'AI助手',
    system: '系统',
  };
  return names[role] || '未知';
}

function getDefaultAvatar(role: MessageRole): string {
  const colors: Record<MessageRole, string> = {
    user: '#2563eb',
    assistant: '#6366f1',
    system: '#10b981',
  };
  const color = colors[role] || '#6366f1';
  const textColor = '#ffffff';
  const initial = getDefaultRoleName(role).charAt(0);
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="18" fill="${color}"/>
      <text x="18" y="23" text-anchor="middle" fill="${textColor}" font-size="14" font-weight="600">${initial}</text>
    </svg>`,
  )}`;
}

function handleCopy() {
  navigator.clipboard.writeText(props.message.content).catch(() => {});
  showActions.value = false;
}

function handleResend() {
  emit('resend', props.message.id);
  showActions.value = false;
}

function handleDelete() {
  emit('delete', props.message.id);
  showActions.value = false;
}

function handleRetry() {
  emit('retry');
  showActions.value = false;
}
</script>

<template>
  <div
    class="message-bubble"
    :class="{
      'is-user': isUser,
      'is-assistant': isAssistant,
      'is-system': isSystem,
      'is-streaming': isStreaming,
      'is-sending': isSending,
      'is-error': isError,
    }"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
  >
    <div class="message-avatar">
      <img
        v-if="displayAvatar.startsWith('http') || displayAvatar.startsWith('data:')"
        :src="displayAvatar"
        :alt="displayRoleName"
        class="avatar-image"
      />
      <span v-else class="avatar-text">{{ displayRoleName.charAt(0) }}</span>
    </div>

    <div class="message-content">
      <div class="message-header">
        <span class="message-author">{{ displayRoleName }}</span>
        <span v-if="timeFormat" class="message-time">{{ timeFormat }}</span>
      </div>

      <ThinkingBlock
        v-if="renderedContent.thinkingProcess"
        :content="renderedContent.thinkingProcess"
      />

      <div
        class="message-body"
        v-html="renderedContent.html"
      ></div>

      <div v-if="isError" class="message-error">
        <span class="error-text">发送失败</span>
        <button class="retry-btn" @click="handleRetry">重试</button>
      </div>

      <div v-if="isStreaming" class="message-status">
        <span class="status-dot"></span>
        <span>生成中...</span>
      </div>

      <div v-if="showActions && !isStreaming" class="message-actions">
        <button class="action-btn" title="复制" @click="handleCopy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button v-if="isUser" class="action-btn" title="重新发送" @click="handleResend">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>
        <button v-if="!isSystem" class="action-btn action-btn--danger" title="删除" @click="handleDelete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-bubble {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  animation: fadeIn 0.25s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-bubble.is-user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color, #f5f7fa);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-info-light-8, #e8eaf6);
  color: var(--el-color-info, #6366f1);
  font-size: 14px;
  font-weight: 600;
}

.is-user .avatar-text {
  background: var(--el-color-primary-light-8, #dbeafe);
  color: var(--el-color-primary, #2563eb);
}

.is-assistant .avatar-text {
  background: var(--el-color-info-light-8, #e8eaf6);
  color: var(--el-color-info, #6366f1);
}

.is-system .avatar-text {
  background: var(--el-color-success-light-8, #dcfce7);
  color: var(--el-color-success, #10b981);
}

.message-content {
  flex: 1;
  max-width: 75%;
  min-width: 0;
}

.is-user .message-content {
  align-items: flex-end;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
}

.is-user .message-header {
  flex-direction: row-reverse;
}

.message-author {
  font-weight: 500;
  color: var(--el-text-color-regular, #606266);
}

.message-time {
  color: var(--el-text-color-placeholder, #a0aec0);
}

.message-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder, #a0aec0);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-info, #6366f1);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

.message-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 6px 10px;
  background: var(--el-color-danger-light-9, #fef2f2);
  border-radius: 6px;
}

.error-text {
  font-size: 12px;
  color: var(--el-color-danger, #ef4444);
}

.retry-btn {
  padding: 2px 8px;
  font-size: 11px;
  color: var(--el-color-danger, #ef4444);
  background: transparent;
  border: 1px solid var(--el-color-danger, #ef4444);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: var(--el-color-danger, #ef4444);
  color: white;
}

.message-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 6px;
  padding: 2px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 6px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--el-text-color-secondary, #909399);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--el-fill-color, #f5f7fa);
  color: var(--el-text-color-primary, #303133);
}

.action-btn--danger:hover {
  background: var(--el-color-danger-light-9, #fef2f2);
  color: var(--el-color-danger, #ef4444);
}

.message-body {
  padding: 10px 14px;
  border-radius: 10px;
  line-height: 1.6;
  word-break: break-word;
}

.is-user .message-body {
  background: var(--el-color-primary, #2563eb);
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.is-assistant .message-body {
  background: var(--el-fill-color, #f5f7fa);
  color: var(--el-text-color-primary, #303133);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-bottom-left-radius: 4px;
}

.is-system .message-body {
  background: var(--el-color-success-light-9, #f0fdf4);
  color: var(--el-text-color-primary, #303133);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 8px;
}

.message-body :deep(pre) {
  margin: 8px 0;
  padding: 12px;
  background: #1e1e1e;
  border-radius: 6px;
  overflow-x: auto;
}

.message-body :deep(code) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace;
  font-size: 13px;
}

.is-user .message-body :deep(pre) {
  background: rgba(0, 0, 0, 0.4);
}

.is-user .message-body :deep(code) {
  color: #e2e8f0;
}

.message-body :deep(p) {
  margin: 0 0 6px;
}

.message-body :deep(p:last-child) {
  margin-bottom: 0;
}

.message-body :deep(ul),
.message-body :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.message-body :deep(a) {
  color: var(--el-color-primary, #2563eb);
  text-decoration: none;
}

.message-body :deep(a:hover) {
  text-decoration: underline;
}

.is-streaming .message-body {
  position: relative;
}

.is-streaming .message-body::after {
  content: '';
  display: inline-block;
  width: 6px;
  height: 14px;
  background: var(--el-color-info, #6366f1);
  margin-left: 4px;
  animation: blink 0.8s infinite;
  border-radius: 2px;
}

.is-user.is-streaming .message-body::after {
  background: rgba(255, 255, 255, 0.7);
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}
</style>
