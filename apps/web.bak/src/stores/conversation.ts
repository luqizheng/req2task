import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  conversationApi,
  Conversation,
  ConversationMessage,
  CreateConversationDto,
  SendMessageResult,
  FollowUpQuestion,
} from '@/api/conversation';
import { ConversationStatus } from '@req2task/dto';

export interface ConversationState {
  currentConversation: Conversation | null;
  messages: ConversationMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  followUpQuestions: FollowUpQuestion[];
  isComplete: boolean;
  questionCount: number;
}

export const MAX_QUESTION_COUNT = 5;

export const useConversationStore = defineStore('conversation', () => {
  const currentConversation = ref<Conversation | null>(null);
  const messages = ref<ConversationMessage[]>([]);
  const conversations = ref<Conversation[]>([]);
  const isLoading = ref(false);
  const isSending = ref(false);
  const error = ref<string | null>(null);
  const followUpQuestions = ref<FollowUpQuestion[]>([]);
  const isComplete = ref(false);

  const questionCount = computed(() => currentConversation.value?.questionCount || 0);

  const isMaxQuestionReached = computed(() => questionCount.value >= MAX_QUESTION_COUNT);

  const canSendMessage = computed(() => !isSending.value && !isMaxQuestionReached.value && currentConversation.value);

  const createConversation = async (dto: CreateConversationDto): Promise<Conversation> => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await conversationApi.createConversation(dto);
      currentConversation.value = result;
      messages.value = [];
      followUpQuestions.value = [];
      isComplete.value = false;
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建会话失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const loadConversation = async (id: string): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      currentConversation.value = await conversationApi.getConversation(id);
      if (currentConversation.value?.messages) {
        messages.value = currentConversation.value.messages;
      } else {
        messages.value = [];
      }
      isComplete.value = currentConversation.value?.status === 'completed';
      followUpQuestions.value = [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载会话失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const loadMessages = async (conversationId: string, limit = 100, offset = 0): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      messages.value = await conversationApi.getMessages(conversationId, { limit, offset });
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载消息失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const sendMessage = async (
    content: string,
    configId?: string
  ): Promise<SendMessageResult | null> => {
    if (!currentConversation.value) return null;

    if (isMaxQuestionReached.value) {
      error.value = `追问次数已达上限（${MAX_QUESTION_COUNT}轮）`;
      return null;
    }

    isSending.value = true;
    error.value = null;

    const userMessage: ConversationMessage = {
      id: `temp-user-${Date.now()}`,
      conversationId: currentConversation.value.id,
      role: 'user',
      content,
      createdAt: new Date(),
    };
    messages.value.push(userMessage);

    try {
      const result = await conversationApi.sendMessage(
        currentConversation.value.id,
        { content },
        configId
      );

      messages.value.push(result.message);
      followUpQuestions.value = result.followUpQuestions;
      isComplete.value = result.isComplete;

      if (currentConversation.value) {
        currentConversation.value = {
          ...currentConversation.value,
          questionCount: result.questionCount,
          messageCount: (currentConversation.value.messageCount || 0) + 2,
        };
      }

      return result;
    } catch (err) {
      const userMsgIndex = messages.value.findIndex((m) => m.id === userMessage.id);
      if (userMsgIndex !== -1) {
        messages.value.splice(userMsgIndex, 1);
      }
      error.value = err instanceof Error ? err.message : '发送消息失败';
      throw err;
    } finally {
      isSending.value = false;
    }
  };

  const completeConversation = async (): Promise<void> => {
    if (!currentConversation.value) return;

    isLoading.value = true;
    error.value = null;
    try {
      currentConversation.value = await conversationApi.updateConversation(
        currentConversation.value.id,
        { status: ConversationStatus.COMPLETED }
      );
      isComplete.value = true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '完成会话失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteConversation = async (id: string): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      await conversationApi.deleteConversation(id);
      conversations.value = conversations.value.filter((c) => c.id !== id);
      if (currentConversation.value?.id === id) {
        reset();
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除会话失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchConversations = async (query?: {
    collectionId?: string;
    rawRequirementId?: string;
    status?: ConversationStatus;
  }): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      conversations.value = await conversationApi.getConversations(query);
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取会话列表失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const clearError = (): void => {
    error.value = null;
  };

  const reset = (): void => {
    currentConversation.value = null;
    messages.value = [];
    conversations.value = [];
    isLoading.value = false;
    isSending.value = false;
    error.value = null;
    followUpQuestions.value = [];
    isComplete.value = false;
  };

  return {
    currentConversation,
    messages,
    conversations,
    isLoading,
    isSending,
    error,
    followUpQuestions,
    isComplete,
    questionCount,
    isMaxQuestionReached,
    canSendMessage,
    createConversation,
    loadConversation,
    loadMessages,
    sendMessage,
    completeConversation,
    deleteConversation,
    fetchConversations,
    clearError,
    reset,
  };
});
