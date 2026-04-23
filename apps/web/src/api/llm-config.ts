import type {
  CreateLLMConfigDto,
  UpdateLLMConfigDto,
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

export const llmConfigApi = {
  getConfigs: () => {
    return api.get<{ configs: LLMConfigResponse[],total: number }>('/ai/llm-configs');
  },

  getConfigById: (id: string) => {
    return api.get<LLMConfigResponse>(`/ai/llm-configs/${id}`);
  },

  createConfig: (data: CreateLLMConfigDto) => {
    return api.post<LLMConfigResponse>('/ai/llm-configs', data);
  },

  updateConfig: (id: string, data: UpdateLLMConfigDto) => {
    return api.put<LLMConfigResponse>(`/ai/llm-configs/${id}`, data);
  },

  deleteConfig: (id: string) => {
    return api.delete(`/ai/llm-configs/${id}`);
  },

  testConfig: (configId: string, testMessage?: string) => {
    return api.post<{
      success: boolean;
      content: string;
      configId: string;
      latencyMs?: number;
      error?: string;
    }>(`/ai/llm-configs/${configId}/test`, { testMessage });
  },
};
