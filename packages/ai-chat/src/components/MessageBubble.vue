<script setup lang="ts">
import { computed } from 'vue';
import type { AIChatMessage, MessageRole } from '../types';
import ThinkingBlock from './ThinkingBlock.vue';
import { useMarkdown } from '../composables/useMarkdown';

interface Props {
  message: AIChatMessage;
}

const props = defineProps<Props>();

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
    user: '#667eea',
    assistant: '#764ba2',
    system: '#67c23a',
  };
  const color = colors[role] || '#999';
  const initial = getDefaultRoleName(role).charAt(0);
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <rect width="40" height="40" fill="${color}" rx="8"/>
      <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="600">${initial}</text>
    </svg>`,
  )}`;
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
        <span v-if="isStreaming" class="message-status">发送中...</span>
        <span v-if="isError" class="message-status error">发送失败</span>
      </div>

      <ThinkingBlock
        v-if="renderedContent.thinkingProcess"
        :content="renderedContent.thinkingProcess"
      />

      <div
        class="message-body"
        v-html="renderedContent.html"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.message-bubble {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
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
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
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
  background: #667eea;
  color: white;
  font-size: 16px;
  font-weight: 600;
}

.is-user .avatar-text {
  background: #667eea;
}

.is-assistant .avatar-text {
  background: #764ba2;
}

.is-system .avatar-text {
  background: #67c23a;
}

.message-content {
  flex: 1;
  max-width: 80%;
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
  color: #4a4a5a;
}

.message-time {
  color: #8a8a9a;
}

.message-status {
  color: #667eea;
  font-style: italic;
}

.message-status.error {
  color: #f56c6c;
}

.message-body {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  word-break: break-word;
}

.is-user .message-body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.is-assistant .message-body {
  background: white;
  color: #1a1a2e;
  border: 1px solid #e8e8e8;
  border-bottom-left-radius: 4px;
}

.is-system .message-body {
  background: #f0f9eb;
  color: #1a1a2e;
  border: 1px solid #e1f3d8;
  border-radius: 8px;
}

.message-body :deep(pre) {
  margin: 8px 0;
  padding: 12px;
  background: #1e1e1e;
  border-radius: 8px;
  overflow-x: auto;
}

.message-body :deep(code) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

.is-user .message-body :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
}

.is-user .message-body :deep(code) {
  color: #d4d4d4;
}

.message-body :deep(p) {
  margin: 0 0 8px;
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
  color: #667eea;
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
  width: 8px;
  height: 16px;
  background: #667eea;
  margin-left: 4px;
  animation: blink 0.8s infinite;
}

.is-user.is-streaming .message-body::after {
  background: white;
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
