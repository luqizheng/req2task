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
  topP: number;
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

export const aiApi = {
  getLLMConfigs: () => {
    return api.get<LLMConfigResponse[]>('/ai/llm-configs');
  },

  getLLMConfigById: (id: string) => {
    return api.get<LLMConfigResponse>(`/ai/llm-configs/${id}`);
  },

  createLLMConfig: (data: CreateLLMConfigDto) => {
    return api.post<LLMConfigResponse>('/ai/llm-configs', data);
  },

  updateLLMConfig: (id: string, data: UpdateLLMConfigDto) => {
    return api.put<LLMConfigResponse>(`/ai/llm-configs/${id}`, data);
  },

  deleteLLMConfig: (id: string) => {
    return api.delete(`/ai/llm-configs/${id}`);
  },

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

  generateAcceptanceCriteria: (requirementContent: string, configId?: string) => {
    return api.post<string[]>(
      '/ai/generate-acceptance-criteria',
      { requirementContent, configId }
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
};
