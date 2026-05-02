import type { ChatRequestDto, CreateRawRequirementDto, RebuildVectorRequestDto, RebuildVectorResponseDto } from '@req2task/dto';
import api from './axios';

export interface ChatResponse {
  content: string;
  configId: string;
}

export interface UserStory {
  role: string;
  goal: string;
  benefit: string;
}

export interface GenerateRequirementResponse {
  id: string;
  title: string;
  description: string;
  priority: string;
  acceptanceCriteria: string[];
  userStories: UserStory[];
}

export interface RawRequirementResponse {
  id: string;
  content: string;
  generatedRequirement?: GenerateRequirementResponse;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationResponse {
  id: string;
  title?: string;
  collectionId?: string;
  rawRequirementId?: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string;
  }>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedUserStory {
  id: string;
  requirementId: string;
  role: string;
  goal: string;
  benefit: string;
  storyPoints: number;
  createdAt: string;
}

export interface GeneratedTask {
  id: string;
  taskNo: string;
  title: string;
  description: string;
  requirementId: string;
  status: string;
  priority: string;
  estimatedHours: number;
  createdAt: string;
}

export interface GeneratedAcceptanceCriteria {
  id: string;
  userStoryId: string;
  criteriaType: string;
  content: string;
  testMethod: string | null;
  createdAt: string;
}

export const aiApi = {
  chat: (data: ChatRequestDto) => {
    return api.post<ChatResponse>('/ai/chat', data);
  },

  aiChat: (messages: Array<{ role: string; content: string }>, configId?: string) => {
    return api.post<ChatResponse>('/ai/ai-chat', {
      messages,
      configId,
    });
  },

  generateRequirement: (input: string, configId?: string) => {
    return api.post<GenerateRequirementResponse>(
      '/ai/generate-requirement',
      { input, configId }
    );
  },

  generateUserStories: (requirementContent: string, configId?: string) => {
    return api.post<UserStory[]>(
      '/ai/generate-user-stories',
      { requirementContent, configId }
    );
  },

  generateUserStoriesForRequirement: (
    requirementId: string,
    projectId: string,
    featurePoints: string,
    context?: string
  ) => {
    return api.post<{ userStories: GeneratedUserStory[]; rawContent: string }>(
      `/llm/generation/user-stories/${requirementId}`,
      { featurePoints, context },
      { params: { projectId } }
    );
  },

  generateTasksForRequirement: (
    requirementId: string,
    projectId: string,
    featurePoints: string,
    context?: string
  ) => {
    return api.post<{ tasks: GeneratedTask[]; rawContent: string }>(
      `/llm/generation/tasks/${requirementId}`,
      { featurePoints, context },
      { params: { projectId } }
    );
  },

  generateAcceptanceCriteria: (requirementContent: string, configId?: string) => {
    return api.post<string[]>(
      '/ai/generate-acceptance-criteria',
      { requirementContent, configId }
    );
  },

  generateAcceptanceCriteriaForUserStory: (
    userStoryId: string,
    context?: string
  ) => {
    return api.post<{ acceptanceCriteria: GeneratedAcceptanceCriteria[]; rawContent: string }>(
      `/llm/generation/acceptance-criteria/${userStoryId}`,
      { context }
    );
  },

  createRawRequirement: (data: CreateRawRequirementDto) => {
    return api.post<RawRequirementResponse>(
      `/ai/raw-requirements`,
      data
    );
  },

  getRawRequirements: () => {
    return api.get<RawRequirementResponse[]>(
      `/ai/raw-requirements`
    );
  },

  generateFromRaw: (id: string, configId?: string) => {
    return api.post<GenerateRequirementResponse>(
      `/ai/raw-requirements/${id}/generate`,
      { configId }
    );
  },

  rebuildVector: (data: RebuildVectorRequestDto) => {
    return api.post<RebuildVectorResponseDto>('/llm/vector/rebuild', data);
  },
};

export const conversationApi = {
  createConversation: (data: {
    collectionId?: string;
    rawRequirementId?: string;
    title?: string;
    systemPrompt?: string;
  }) => {
    return api.post<{ code: number; data: { id: string } }>('/api/ai-chat/ai/conversations', data);
  },

  getConversation: (id: string) => {
    return api.get<ConversationResponse>(`/api/ai-chat/ai/conversations/${id}`);
  },

  sendMessage: (conversationId: string, data: {
    content: string;
    files?: Array<{ type: string; data: string; name?: string }>;
    configId?: string;
  }) => {
    return api.post(`/api/ai-chat/ai/conversations/${conversationId}/messages`, data);
  },

  getStreamUrl: (conversationId: string) => {
    return `/api/ai-chat/ai/conversations/${conversationId}/messages/stream`;
  },

  getMessages: (conversationId: string, limit = 100, offset = 0) => {
    return api.get(`/api/ai-chat/ai/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`);
  },
};
