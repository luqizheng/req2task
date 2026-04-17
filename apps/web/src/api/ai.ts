import type {
  CreateLLMConfigDto,
  UpdateLLMConfigDto,
  ChatRequestDto,
  CreateRawRequirementDto,
} from '@req2task/dto';
import api from './axios';

export interface LLMConfigResponse {
  id: string;
  name: string;
  provider: string;
  modelName: string;
  baseUrl?: string | null;
  maxTokens: number;
  temperature: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  apiKey?: string;
}

export interface ChatResponse {
  content: string;
  configId: string;
}

export interface ApiErrorResponse {
  code: number;
  message: string;
  data?: unknown;
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
  moduleId: string;
  content: string;
  generatedRequirement?: GenerateRequirementResponse;
  createdAt: string;
  updatedAt: string;
}

export const aiApi = {
  getLLMConfigs: () => {
    return api.get<ApiErrorResponse & { data: LLMConfigResponse[] }>('/ai/llm-configs');
  },

  getLLMConfigById: (id: string) => {
    return api.get<ApiErrorResponse & { data: LLMConfigResponse }>(`/ai/llm-configs/${id}`);
  },

  createLLMConfig: (data: CreateLLMConfigDto) => {
    return api.post<ApiErrorResponse & { data: LLMConfigResponse }>('/ai/llm-configs', data);
  },

  updateLLMConfig: (id: string, data: UpdateLLMConfigDto) => {
    return api.put<ApiErrorResponse & { data: LLMConfigResponse }>(`/ai/llm-configs/${id}`, data);
  },

  deleteLLMConfig: (id: string) => {
    return api.delete<ApiErrorResponse>(`/ai/llm-configs/${id}`);
  },

  chat: (data: ChatRequestDto) => {
    return api.post<ApiErrorResponse & { data: ChatResponse }>('/ai/chat', data);
  },

  aiChat: (messages: Array<{ role: string; content: string }>, configId?: string) => {
    return api.post<ApiErrorResponse & { data: ChatResponse }>('/ai/ai-chat', {
      messages,
      configId,
    });
  },

  generateRequirement: (input: string, configId?: string) => {
    return api.post<ApiErrorResponse & { data: GenerateRequirementResponse }>(
      '/ai/generate-requirement',
      { input, configId }
    );
  },

  generateUserStories: (requirementContent: string, configId?: string) => {
    return api.post<ApiErrorResponse & { data: UserStory[] }>(
      '/ai/generate-user-stories',
      { requirementContent, configId }
    );
  },

  generateAcceptanceCriteria: (requirementContent: string, configId?: string) => {
    return api.post<ApiErrorResponse & { data: string[] }>(
      '/ai/generate-acceptance-criteria',
      { requirementContent, configId }
    );
  },

  createRawRequirement: (moduleId: string, data: CreateRawRequirementDto) => {
    return api.post<ApiErrorResponse & { data: RawRequirementResponse }>(
      `/ai/modules/${moduleId}/raw-requirements`,
      data
    );
  },

  getRawRequirements: (moduleId: string) => {
    return api.get<ApiErrorResponse & { data: RawRequirementResponse[] }>(
      `/ai/modules/${moduleId}/raw-requirements`
    );
  },

  generateFromRaw: (id: string, configId?: string) => {
    return api.post<ApiErrorResponse & { data: GenerateRequirementResponse }>(
      `/ai/raw-requirements/${id}/generate`,
      { configId }
    );
  },
};
