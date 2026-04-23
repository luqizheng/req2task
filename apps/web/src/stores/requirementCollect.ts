import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  rawRequirementsApi,
  CreateRawRequirementInput,
} from '@/api/rawRequirements';
import type { RawRequirementResponseDto, CollectionType } from '@req2task/dto';
import { RawRequirementStatus } from '@req2task/dto';
import {
  conversationApi,
  Conversation,
  ConversationMessage,
  CreateConversationDto,
} from '@/api/conversation';

export const useRequirementCollectStore = defineStore('requirementCollect', () => {
  const currentProjectId = ref<string | null>(null);
  const rawRequirements = ref<RawRequirementResponseDto[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const currentRawRequirementId = ref<string | null>(null);

  const currentConversation = ref<Conversation | null>(null);
  const conversationMessages = ref<ConversationMessage[]>([]);

  const currentRawRequirement = computed(() => {
    if (!currentRawRequirementId.value) return null;
    return rawRequirements.value.find(r => r.id === currentRawRequirementId.value) || null;
  });

  const unhandledRequirements = computed(() => {
    return rawRequirements.value.filter(
      r => r.status !== RawRequirementStatus.CONVERTED && 
           r.status !== RawRequirementStatus.DISCARDED && 
           r.status !== RawRequirementStatus.CLARIFIED
    );
  });

  const fetchRawRequirements = async (projectId: string): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    currentProjectId.value = projectId;
    try {
      rawRequirements.value = await rawRequirementsApi.getByProject(projectId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取原始需求失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const selectRawRequirement = (rawRequirementId: string | null): void => {
    currentRawRequirementId.value = rawRequirementId;
  };

  const addRawRequirement = async (
    content: string,
    source: string = '手动添加',
    collectionType?: CollectionType
): Promise<RawRequirementResponseDto | null> => {
    if (!currentProjectId.value) return null;

    isLoading.value = true;
    error.value = null;
    try {
      const input: CreateRawRequirementInput = {
        projectId: currentProjectId.value,
        content,
        source,
        collectionType,
      };
      const result = await rawRequirementsApi.create(input);
      rawRequirements.value.unshift(result);
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '添加原始需求失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteRawRequirement = async (rawRequirementId: string): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      await rawRequirementsApi.deleteRawRequirement(rawRequirementId);
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

  const clarifyRawRequirement = async (
    rawRequirementId: string,
    clarifiedContent: string
  ): Promise<RawRequirementResponseDto | null> => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await rawRequirementsApi.clarifyRawRequirement(
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

  const clearError = (): void => {
    error.value = null;
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

      if (currentProjectId.value) {
        const updatedRawRequirements = await rawRequirementsApi.getByProject(currentProjectId.value);
        rawRequirements.value = updatedRawRequirements;
      }
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
    currentProjectId.value = null;
    rawRequirements.value = [];
    currentRawRequirementId.value = null;
    currentConversation.value = null;
    conversationMessages.value = [];
    isLoading.value = false;
    error.value = null;
  };

  return {
    currentProjectId,
    rawRequirements,
    isLoading,
    error,
    currentRawRequirementId,
    currentRawRequirement,
    unhandledRequirements,
    fetchRawRequirements,
    selectRawRequirement,
    addRawRequirement,
    deleteRawRequirement,
    clarifyRawRequirement,
    clearError,
    reset,
    currentConversation,
    conversationMessages,
    createConversationForRawRequirement,
    loadConversation,
    sendMessageViaConversation,
  };
});
