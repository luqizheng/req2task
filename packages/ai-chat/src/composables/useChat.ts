import { ref, computed } from 'vue';
import type { AIChatMessage, AIChatConfig, MessageRole } from '../types';
import { generateId } from '../utils/id-generator';
import { useStream } from './useStream';

const DEFAULT_ROLE_NAMES: Record<MessageRole, string> = {
  user: '用户',
  assistant: 'AI助手',
  system: '系统',
};

export interface UseChatOptions {
  config?: AIChatConfig;
  adapterName?: string;
  onMessageSent?: (message: AIChatMessage) => void;
  onMessageReceived?: (message: AIChatMessage) => void;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  onError?: (error: Error) => void;
  onConversationCreated?: (conversationId: string) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const messages = ref<AIChatMessage[]>([]);
  const config = ref<AIChatConfig>(options.config || {});
  const adapterName = ref<string>(options.adapterName || 'default');
  const conversationId = ref<string | null>(config.value.sessionId || null);
  const isStreaming = ref(false);
  const streamingContent = ref('');

  const { startStream, abort: abortStream } = useStream();

  const currentConversationId = computed(() => conversationId.value);

  function updateConfig(newConfig: AIChatConfig): void {
    config.value = { ...config.value, ...newConfig };
    if (newConfig.sessionId !== undefined) {
      conversationId.value = newConfig.sessionId || null;
    }
  }

  function setConversationId(id: string | null): void {
    conversationId.value = id;
  }

  function getRoleName(role: MessageRole): string {
    const customNames: Record<MessageRole, string | undefined> = {
      user: config.value.userRoleName,
      assistant: config.value.assistantRoleName,
      system: config.value.systemRoleName,
    };
    return customNames[role] || DEFAULT_ROLE_NAMES[role];
  }

  function getAvatar(role: MessageRole): string | undefined {
    const customAvatars: Record<MessageRole, string | undefined> = {
      user: config.value.userAvatar,
      assistant: config.value.assistantAvatar,
      system: undefined,
    };
    return customAvatars[role];
  }

  function createMessage(input: Partial<AIChatMessage>): AIChatMessage {
    return {
      id: input.id || generateId(),
      role: input.role || 'user',
      content: input.content || '',
      createdAt: input.createdAt || new Date(),
      status: input.status || 'sending',
      roleName: input.roleName || getRoleName(input.role || 'user'),
      avatar: input.avatar || getAvatar(input.role || 'user'),
      metadata: input.metadata,
    };
  }

  function addMessage(message: AIChatMessage): void {
    messages.value.push(message);
  }

  function updateMessage(id: string, updates: Partial<AIChatMessage>): void {
    const index = messages.value.findIndex((m) => m.id === id);
    if (index !== -1) {
      messages.value[index] = { ...messages.value[index], ...updates };
    }
  }

  function clearMessages(): void {
    messages.value = [];
    streamingContent.value = '';
    isStreaming.value = false;
  }

  function deleteMessage(id: string): void {
    const index = messages.value.findIndex((m) => m.id === id);
    if (index !== -1) {
      messages.value.splice(index, 1);
    }
  }

  function resendMessage(id: string): Promise<void> | undefined {
    const msg = messages.value.find((m) => m.id === id);
    if (!msg || msg.role !== 'user' || isStreaming.value) {
      return;
    }
    deleteMessage(msg.id);
    const nextAiMsg = messages.value.find((m) => m.isStreaming);
    if (nextAiMsg) {
      deleteMessage(nextAiMsg.id);
    }
    return sendMessage(msg.content);
  }

  function getMessages(): AIChatMessage[] {
    return messages.value.map((msg) => ({
      ...msg,
      content: msg.content || '',
    }));
  }

  async function sendMessage(content: string): Promise<void> {
    if (!content.trim() || isStreaming.value) {
      return;
    }

    const userMsg = createMessage({
      role: 'user',
      content: content.trim(),
      status: 'done',
    });
    addMessage(userMsg);
    options.onMessageSent?.(userMsg);

    const aiMsgId = generateId();
    const aiMsg = createMessage({
      id: aiMsgId,
      role: 'assistant',
      content: '',
      status: 'streaming',
      isStreaming: true,
    });
    addMessage(aiMsg);

    isStreaming.value = true;
    streamingContent.value = '';
    options.onStreamStart?.();

    const endpoint = config.value.endpoint || '/api/chat';
    let currentConvId = conversationId.value || undefined;

    await startStream({
      endpoint,
      message: content.trim(),
      headers: config.value.headers,
      sessionId: config.value.sessionId,
      conversationId: currentConvId || undefined,
      adapterName: adapterName.value,
      onChunk: (chunk) => {
        if (chunk.type === 'content' && chunk.content) {
          streamingContent.value += chunk.content;
          updateMessage(aiMsgId, {
            content: streamingContent.value,
            status: 'streaming',
          });
        }
        if (chunk.type === 'metadata' && chunk.conversationId) {
          if (chunk.isNewConversation || !currentConvId) {
            currentConvId = chunk.conversationId;
            conversationId.value = chunk.conversationId;
            options.onConversationCreated?.(chunk.conversationId);
          }
        }
      },
      onComplete: () => {
        updateMessage(aiMsgId, {
          content: streamingContent.value,
          status: 'done',
          isStreaming: false,
        });

        const completedMessage = messages.value.find((m) => m.id === aiMsgId);
        if (completedMessage) {
          options.onMessageReceived?.(completedMessage);
          options.onConversationCreated?.(currentConvId || '');
          options.onStreamEnd?.();
        }

        isStreaming.value = false;
        streamingContent.value = '';
      },
      onError: (error) => {
        updateMessage(aiMsgId, {
          content: streamingContent.value || `Error: ${error.message}`,
          status: 'error',
          isStreaming: false,
        });
        options.onError?.(error);
        options.onStreamEnd?.();
        isStreaming.value = false;
        streamingContent.value = '';
      },
    });
  }

  function stopStream(): void {
    abortStream();
    const streamingMsg = messages.value.find((m) => m.isStreaming);
    if (streamingMsg) {
      updateMessage(streamingMsg.id, {
        content: streamingContent.value || 'Generation stopped',
        status: 'done',
        isStreaming: false,
      });
    }
    isStreaming.value = false;
    streamingContent.value = '';
    options.onStreamEnd?.();
  }

  function loadMessages(newMessages: AIChatMessage[]): void {
    messages.value = newMessages.map((msg) =>
      createMessage({
        ...msg,
        createdAt: new Date(msg.createdAt),
      }),
    );
  }

  if (config.value.initialMessages?.length) {
    loadMessages(config.value.initialMessages);
  }

  return {
    messages,
    config,
    conversationId: currentConversationId,
    isStreaming,
    streamingContent,
    updateConfig,
    setConversationId,
    createMessage,
    addMessage,
    updateMessage,
    deleteMessage,
    resendMessage,
    clearMessages,
    getMessages,
    sendMessage,
    stopStream,
    loadMessages,
  };
}
