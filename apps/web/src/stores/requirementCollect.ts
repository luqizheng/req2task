import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  requirementCollectionApi,
  RawRequirementCollectionResponse,
  RawRequirementCollectionDetail,
  RawRequirementInCollection,
  CreateCollectionDto,
  CompleteCollectionResult,
  CollectionStatus,
} from '@/api/requirementCollection';
import {
  conversationApi,
  Conversation,
  ConversationMessage,
  CreateConversationDto,
} from '@/api/conversation';

export const useRequirementCollectStore = defineStore('requirementCollect', () => {
  const collections = ref<RawRequirementCollectionResponse[]>([]);
  const currentCollection = ref<RawRequirementCollectionDetail | null>(null);
  const rawRequirements = ref<RawRequirementInCollection[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const currentRawRequirementId = ref<string | null>(null);

  const currentConversation = ref<Conversation | null>(null);
  const conversationMessages = ref<ConversationMessage[]>([]);

  const currentRawRequirement = computed(() => {
    if (!currentRawRequirementId.value) return null;
    return rawRequirements.value.find(r => r.id === currentRawRequirementId.value) || null;
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

  const deleteCollection = async (collectionId: string): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      await requirementCollectionApi.deleteCollection(collectionId);
      collections.value = collections.value.filter(c => c.id !== collectionId);
      if (currentCollection.value?.id === collectionId) {
        currentCollection.value = null;
        rawRequirements.value = [];
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
          status: CollectionStatus.COMPLETED,
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

  const createConversationForCollection = async (collectionId: string): Promise<Conversation> => {
    isLoading.value = true;
    error.value = null;
    try {
      const dto: CreateConversationDto = {
        collectionId,
      };
      currentConversation.value = await conversationApi.createConversation(dto);
      conversationMessages.value = [];
      return currentConversation.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建会话失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createConversationForRawRequirement = async (rawRequirementId: string): Promise<Conversation> => {
    isLoading.value = true;
    error.value = null;
    try {
      const dto: CreateConversationDto = {
        rawRequirementId,
      };
      currentConversation.value = await conversationApi.createConversation(dto);
      conversationMessages.value = [];
      return currentConversation.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建会话失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const loadConversation = async (conversationId: string): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      currentConversation.value = await conversationApi.getConversation(conversationId);
      if (currentConversation.value?.messages) {
        conversationMessages.value = currentConversation.value.messages;
      } else {
        conversationMessages.value = [];
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载会话失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const sendMessageViaConversation = async (
    content: string,
    configId?: string
  ): Promise<void> => {
    if (!currentConversation.value) return;

    isLoading.value = true;
    error.value = null;

    const userMessage: ConversationMessage = {
      id: `temp-user-${Date.now()}`,
      conversationId: currentConversation.value.id,
      role: 'user',
      content,
      createdAt: new Date(),
    };
    conversationMessages.value.push(userMessage);

    try {
      const result = await conversationApi.sendMessage(
        currentConversation.value.id,
        { content },
        configId
      );

      conversationMessages.value.push(result.message);

      currentConversation.value = {
        ...currentConversation.value,
        questionCount: result.questionCount,
        messageCount: (currentConversation.value.messageCount || 0) + 2,
      };

      const updatedRawRequirements = await requirementCollectionApi.getRawRequirements(
        currentCollection.value!.id
      );
      rawRequirements.value = updatedRawRequirements;
    } catch (err) {
      const msgIndex = conversationMessages.value.findIndex((m) => m.id === userMessage.id);
      if (msgIndex !== -1) {
        conversationMessages.value.splice(msgIndex, 1);
      }
      error.value = err instanceof Error ? err.message : '发送消息失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const reset = (): void => {
    collections.value = [];
    currentCollection.value = null;
    rawRequirements.value = [];
    currentRawRequirementId.value = null;
    currentConversation.value = null;
    conversationMessages.value = [];
    isLoading.value = false;
    error.value = null;
  };

  return {
    collections,
    currentCollection,
    rawRequirements,
    isLoading,
    error,
    currentRawRequirementId,
    currentRawRequirement,
    canCompleteCollection,
    unclarifiedRequirements,
    createCollection,
    fetchCollections,
    selectCollection,
    selectRawRequirement,
    addRequirement,
    deleteCollection,
    completeCollection,
    clarifyRequirement,
    deleteRequirement,
    clearError,
    reset,
    currentConversation,
    conversationMessages,
    createConversationForCollection,
    createConversationForRawRequirement,
    loadConversation,
    sendMessageViaConversation,
  };
});
