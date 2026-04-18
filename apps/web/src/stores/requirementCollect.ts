import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  requirementCollectionApi,
  RawRequirementCollectionResponse,
  RawRequirementCollectionDetail,
  RawRequirementInCollection,
  CreateCollectionDto,
  ChatMessage,
  ChatResult,
  CompleteCollectionResult,
} from '@/api/requirementCollection';

export interface ChatMessageUI extends ChatMessage {
  id: string;
  isLoading?: boolean;
}

export const MAX_QUESTION_COUNT = 5;

export const useRequirementCollectStore = defineStore('requirementCollect', () => {
  const collections = ref<RawRequirementCollectionResponse[]>([]);
  const currentCollection = ref<RawRequirementCollectionDetail | null>(null);
  const rawRequirements = ref<RawRequirementInCollection[]>([]);
  const chatHistory = ref<ChatMessageUI[]>([]);
  const isLoading = ref(false);
  const isSending = ref(false);
  const error = ref<string | null>(null);
  const currentRawRequirementId = ref<string | null>(null);

  const currentRawRequirement = computed(() => {
    if (!currentRawRequirementId.value) return null;
    return rawRequirements.value.find(r => r.id === currentRawRequirementId.value) || null;
  });

  const chatRoundCount = computed(() => {
    return chatHistory.value.filter(m => m.role === 'assistant').length;
  });

  const currentQuestionCount = computed(() => {
    return currentRawRequirement.value?.questionCount || 0;
  });

  const isMaxQuestionReached = computed(() => {
    return currentQuestionCount.value >= MAX_QUESTION_COUNT;
  });

  const canCompleteCollection = computed(() => {
    if (!currentCollection.value) return false;
    const unhandledRequirements = rawRequirements.value.filter(
      r => r.status !== 'converted' && r.status !== 'discarded' && r.status !== 'clarified'
    );
    return unhandledRequirements.length === 0;
  });

  const unclarifiedRequirements = computed(() => {
    return rawRequirements.value.filter(
      r => r.status !== 'converted' && r.status !== 'discarded' && r.status !== 'clarified'
    );
  });

  const createCollection = async (dto: CreateCollectionDto): Promise<RawRequirementCollectionResponse> => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await requirementCollectionApi.createCollection(dto);
      collections.value.unshift(result);
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建收集失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchCollections = async (projectId: string): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      collections.value = await requirementCollectionApi.getCollections(projectId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取收集列表失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const selectCollection = async (collectionId: string): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      currentCollection.value = await requirementCollectionApi.getCollection(collectionId);
      rawRequirements.value = currentCollection.value.rawRequirements || [];
      chatHistory.value = [];
      currentRawRequirementId.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取收集详情失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const selectRawRequirement = (rawRequirementId: string | null): void => {
    currentRawRequirementId.value = rawRequirementId;
    if (rawRequirementId) {
      const raw = rawRequirements.value.find(r => r.id === rawRequirementId);
      if (raw?.sessionHistory) {
        chatHistory.value = raw.sessionHistory.map((m, i) => ({
          ...m,
          id: `${m.role}-${i}-${Date.now()}`,
        }));
      } else {
        chatHistory.value = [];
      }
    } else {
      chatHistory.value = [];
    }
  };

  const sendMessage = async (
    message: string,
    source: string = '对话收集',
    configId?: string
  ): Promise<ChatResult | null> => {
    if (!currentCollection.value) return null;

    isSending.value = true;
    error.value = null;

    const userMessage: ChatMessageUI = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    chatHistory.value.push(userMessage);

    const loadingMessage: ChatMessageUI = {
      id: `assistant-loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isLoading: true,
    };
    chatHistory.value.push(loadingMessage);

    try {
      const result = await requirementCollectionApi.chatWithCollection(
        currentCollection.value.id,
        message,
        source,
        configId
      );

      const loadingIndex = chatHistory.value.findIndex(m => m.id === loadingMessage.id);
      if (loadingIndex !== -1) {
        chatHistory.value.splice(loadingIndex, 1);
      }

      const assistantMessage: ChatMessageUI = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.assistantMessage,
        timestamp: new Date().toISOString(),
      };
      chatHistory.value.push(assistantMessage);

      currentRawRequirementId.value = result.rawRequirementId;

      const updatedRawRequirements = await requirementCollectionApi.getRawRequirements(
        currentCollection.value.id
      );
      rawRequirements.value = updatedRawRequirements;

      return {
        assistantMessage: result.assistantMessage,
        followUpQuestions: result.followUpQuestions,
        isComplete: result.isComplete,
        questionCount: result.questionCount,
      };
    } catch (err) {
      const loadingIndex = chatHistory.value.findIndex(m => m.id === loadingMessage.id);
      if (loadingIndex !== -1) {
        chatHistory.value.splice(loadingIndex, 1);
      }
      error.value = err instanceof Error ? err.message : '发送消息失败';
      throw err;
    } finally {
      isSending.value = false;
    }
  };

  const addRequirement = async (
    content: string,
    source: string = '手动添加'
  ): Promise<RawRequirementInCollection | null> => {
    if (!currentCollection.value) return null;

    isLoading.value = true;
    error.value = null;
    try {
      const result = await requirementCollectionApi.addRawRequirement(
        currentCollection.value.id,
        { content, source }
      );
      rawRequirements.value.unshift(result);
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '添加原始需求失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const continueChat = async (
    rawRequirementId: string,
    message: string,
    configId?: string
  ): Promise<ChatResult> => {
    if (isMaxQuestionReached.value) {
      error.value = `追问次数已达上限（${MAX_QUESTION_COUNT}轮）`;
      throw new Error(error.value);
    }

    isSending.value = true;
    error.value = null;

    const userMessage: ChatMessageUI = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    chatHistory.value.push(userMessage);

    try {
      const result = await requirementCollectionApi.chatCollect(rawRequirementId, message, configId);

      const assistantMessage: ChatMessageUI = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.assistantMessage,
        timestamp: new Date().toISOString(),
      };
      chatHistory.value.push(assistantMessage);

      const updatedRawRequirements = await requirementCollectionApi.getRawRequirements(
        currentCollection.value!.id
      );
      rawRequirements.value = updatedRawRequirements;

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '发送消息失败';
      throw err;
    } finally {
      isSending.value = false;
    }
  };

  const deleteCollection = async (collectionId: string): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      await requirementCollectionApi.deleteCollection(collectionId);
      collections.value = collections.value.filter(c => c.id !== collectionId);
      if (currentCollection.value?.id === collectionId) {
        currentCollection.value = null;
        rawRequirements.value = [];
        chatHistory.value = [];
        currentRawRequirementId.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除收集失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const completeCollection = async (): Promise<CompleteCollectionResult> => {
    if (!currentCollection.value) {
      return { success: false, message: '没有选中的收集' };
    }

    isLoading.value = true;
    error.value = null;
    try {
      const result = await requirementCollectionApi.completeCollection(currentCollection.value.id);
      if (result.success) {
        currentCollection.value = {
          ...currentCollection.value,
          status: 'completed',
        };
      }
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '完成收集失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const clarifyRequirement = async (
    rawRequirementId: string,
    clarifiedContent: string
  ): Promise<RawRequirementInCollection | null> => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await requirementCollectionApi.clarifyRawRequirement(
        rawRequirementId,
        clarifiedContent
      );
      const index = rawRequirements.value.findIndex(r => r.id === rawRequirementId);
      if (index !== -1) {
        rawRequirements.value[index] = result;
      }
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '标记澄清失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteRequirement = async (rawRequirementId: string): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      await requirementCollectionApi.deleteRawRequirement(rawRequirementId);
      rawRequirements.value = rawRequirements.value.filter(r => r.id !== rawRequirementId);
      if (currentRawRequirementId.value === rawRequirementId) {
        currentRawRequirementId.value = null;
        chatHistory.value = [];
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除需求失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const clearError = (): void => {
    error.value = null;
  };

  const reset = (): void => {
    collections.value = [];
    currentCollection.value = null;
    rawRequirements.value = [];
    chatHistory.value = [];
    currentRawRequirementId.value = null;
    isLoading.value = false;
    isSending.value = false;
    error.value = null;
  };

  return {
    collections,
    currentCollection,
    rawRequirements,
    chatHistory,
    isLoading,
    isSending,
    error,
    currentRawRequirementId,
    currentRawRequirement,
    chatRoundCount,
    currentQuestionCount,
    isMaxQuestionReached,
    canCompleteCollection,
    unclarifiedRequirements,
    createCollection,
    fetchCollections,
    selectCollection,
    selectRawRequirement,
    sendMessage,
    addRequirement,
    continueChat,
    deleteCollection,
    completeCollection,
    clarifyRequirement,
    deleteRequirement,
    clearError,
    reset,
  };
});
