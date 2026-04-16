<script setup lang="ts">
import { ref, computed, watch, nextTick, toRaw } from 'vue';
import { Window, MessageList, MessageBubble, InputArea } from './index';
import { useChat } from '../composables/useChat';
import type { AIChatMessage, AIChatConfig } from '../types';

interface Props {
  config?: AIChatConfig;
  headers?: Record<string, string>;
  title?: string;
  placeholder?: string;
  maxHeight?: string;
  autoScroll?: boolean;
  showWindowHeader?: boolean;
  adapterName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'AI 助手',
  placeholder: '输入消息，AI 将实时响应...',
  maxHeight: '600px',
  autoScroll: true,
  showWindowHeader: true,
  adapterName: 'default',
});

const emit = defineEmits<{
  (e: 'message-sent', message: AIChatMessage): void;
  (e: 'message-received', message: AIChatMessage): void;
  (e: 'done', message: AIChatMessage, conversationId: string): void;
  (e: 'stream-start'): void;
  (e: 'stream-end'): void;
  (e: 'error', error: Error): void;
  (e: 'conversation-created', conversationId: string): void;
}>();

const inputMessage = ref('');
const messageListRef = ref<InstanceType<typeof MessageList> | null>(null);

const mergedConfig = computed(() => ({
  ...props.config,
  headers: {
    ...props.config?.headers,
    ...props.headers,
  },
}));

const {
  messages,
  isStreaming,
  conversationId,
  updateConfig,
  clearMessages,
  getMessages,
  sendMessage,
  stopStream,
  loadMessages,
  setConversationId,
} = useChat({
  config: mergedConfig.value,
  adapterName: props.adapterName,
  onMessageSent: (message) => {
    emit('message-sent', Object.assign({}, toRaw(message)));
  },
  onMessageReceived: (message) => {
    emit('message-received', Object.assign({}, toRaw(message)));
  },
  onStreamStart: () => {
    emit('stream-start');
  },
  onStreamEnd: () => {
    emit('stream-end');
  },
  onError: (error) => {
    emit('error', error);
  },
  onConversationCreated: (id) => {
    emit('conversation-created', id);
  },
});

watch(
  [() => props.config, () => props.headers],
  ([newConfig, newHeaders]) => {
    const config = {
      ...newConfig,
      headers: {
        ...newConfig?.headers,
        ...newHeaders,
      },
    };
    updateConfig(config);
    if (config.sessionId) {
      setConversationId(config.sessionId);
    }
    if (config.initialMessages?.length) {
      loadMessages(config.initialMessages);
    }
  },
  { deep: true },
);

function handleSend(content: string) {
  if (!content.trim() || isStreaming.value) return;

  sendMessage(content).catch((error) => {
    emit('error', error);
  });
}

function handleLoadMore() {
  console.log('Load more messages');
}

function scrollToBottom() {
  nextTick(() => {
    messageListRef.value?.scrollToBottom();
  });
}

watch(
  () => messages.value.length,
  () => {
    if (props.autoScroll) {
      scrollToBottom();
    }
  },
);

defineExpose({
  clearMessages,
  getMessages,
  isStreaming,
  stopStream,
  getConversationId: () => conversationId.value,
  setConversationId: (id: string | null) => setConversationId(id),
  scrollToBottom,
});
</script>

<template>
  <Window :title="title" :max-height="maxHeight" :show-header="showWindowHeader" class="ai-chat">
    <template v-if="showWindowHeader" #header>
      <div class="chat-header">
        <span class="header-title">{{ title }}</span>
        <button v-if="isStreaming" class="stop-btn" @click="stopStream">停止</button>
      </div>
    </template>

    <MessageList
      ref="messageListRef"
      :messages="messages"
      :auto-scroll="autoScroll"
      class="message-list-container"
      @load-more="handleLoadMore"
    >
      <MessageBubble
        v-for="message in messages"
        :key="message.id"
        :message="message"
      />
    </MessageList>

    <InputArea
      v-model="inputMessage"
      :placeholder="placeholder"
      :disabled="isStreaming"
      @send="handleSend"
    />
  </Window>
</template>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
}

.stop-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.stop-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.message-list-container {
  flex: 1;
  overflow: hidden;
}
</style>
