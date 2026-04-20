import type {
  CreateLLMConfigDto,
  UpdateLLMConfigDto,
} from '@req2task/dto';
import api from './axios';

const AI_CHAT_BASE = '/api/ai-chat';

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
    return api.get<LLMConfigResponse[]>(`${AI_CHAT_BASE}/ai/llm-configs`);
  },

  getConfigById: (id: string) => {
    return api.get<LLMConfigResponse>(`${AI_CHAT_BASE}/ai/llm-configs/${id}`);
  },

  createConfig: (data: CreateLLMConfigDto) => {
    return api.post<LLMConfigResponse>(`${AI_CHAT_BASE}/ai/llm-configs`, data);
  },

  updateConfig: (id: string, data: UpdateLLMConfigDto) => {
    return api.put<LLMConfigResponse>(`${AI_CHAT_BASE}/ai/llm-configs/${id}`, data);
  },

  deleteConfig: (id: string) => {
    return api.delete(`${AI_CHAT_BASE}/ai/llm-configs/${id}`);
  },

  testConfig: (configId: string, testMessage?: string) => {
    return api.post<{
      success: boolean;
      content: string;
      configId: string;
      latencyMs?: number;
      error?: string;
    }>(`${AI_CHAT_BASE}/ai/llm-configs/${configId}/test`, { testMessage });
  },
};
