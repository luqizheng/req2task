import api from './axios';
import type { CreateRawRequirementDto } from '@req2task/dto';
export { RawRequirementStatus } from './requirementCollection';
export type { RawRequirementStatus as RawRequirementStatusType } from './requirementCollection';

export interface RawRequirementListParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface QuestionAndAnswer {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  answeredAt?: string;
}

export interface RawRequirementResponse {
  id: string;
  collectionId?: string;
  conversationId?: string;
  content: string;
  source?: string;
  status: string;
  questionAndAnswers: QuestionAndAnswer[];
  keyElements: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatResult {
  assistantMessage: string;
  followUpQuestions: string[];
  isComplete: boolean;
  questionCount?: number;
}

export interface RawRequirementStreamOptions {
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
  onComplete?: () => void;
}

export const rawRequirementsApi = {
  getByModule: (moduleId: string, params?: RawRequirementListParams) => {
    const { page = 1, limit = 20, ...rest } = params || {};
    return api.get<RawRequirementResponse[]>(
      `/ai/modules/${moduleId}/raw-requirements`,
      { params: { page, limit, ...rest } }
    );
  },

  create: (moduleId: string, data: CreateRawRequirementDto) => {
    return api.post<RawRequirementResponse>(
      `/ai/modules/${moduleId}/raw-requirements`,
      data
    );
  },

  generate: (id: string, configId?: string) => {
    return api.post(`/ai/raw-requirements/${id}/generate`, { configId });
  },

  detectConflicts: (id: string, configId?: string) => {
    return api.post(`/ai/raw-requirements/${id}/detect-conflicts`, { configId });
  },

  getRawRequirement: (rawRequirementId: string): Promise<RawRequirementResponse> => {
    return api.get(`/raw-requirements/${rawRequirementId}`);
  },

  chatCollect: (
    rawRequirementId: string,
    message: string,
    configId?: string,
    files?: Array<{ type: string; data: string; name?: string }>,
    systemPrompt?: string
  ): Promise<any> => {
    return api.post(`/raw-requirements/${rawRequirementId}/chat`, {
      message,
      configId,
      files,
      systemPrompt,
    });
  },

  streamChatCollect: (
    rawRequirementId: string,
    message: string,
    configId?: string,
    _files?: Array<{ type: string; data: string; name?: string }>,
    systemPrompt?: string
  ): EventSource => {
    const params = new URLSearchParams({
      message,
    });
    if (configId) params.append('configId', configId);
    if (systemPrompt) params.append('systemPrompt', systemPrompt);

    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_BASE_URL}/raw-requirements/${rawRequirementId}/stream?${params}`
    );
    return eventSource;
  },

  deleteRawRequirement: (rawRequirementId: string): Promise<void> => {
    return api.delete(`/raw-requirements/${rawRequirementId}`);
  },

  getFollowUpQuestions: (rawRequirementId: string): Promise<string[]> => {
    return api.get(`/collections/raw-requirements/${rawRequirementId}/follow-up-questions`);
  },

  clarifyRawRequirement: (
    rawRequirementId: string,
    clarifiedContent: string
  ): Promise<RawRequirementResponse> => {
    return api.post(`/collections/raw-requirements/${rawRequirementId}/clarify`, {
      clarifiedContent,
    });
  },
};
