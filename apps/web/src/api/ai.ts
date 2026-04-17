import type {
  CreateLLMConfigDto,
  UpdateLLMConfigDto,
  ChatRequestDto,
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
};
