import api from './axios';

export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CollectionType = 'meeting' | 'interview' | 'document' | 'other';

export const CollectionStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
} as const;
export type CollectionStatus = (typeof CollectionStatus)[keyof typeof CollectionStatus];

export const RawRequirementStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CLARIFIED: 'CLARIFIED',
  CONVERTED: 'CONVERTED',
  DISCARDED: 'DISCARDED',
  FAILED: 'FAILED',
} as const;
export type RawRequirementStatus = (typeof RawRequirementStatus)[keyof typeof RawRequirementStatus];

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CreateCollectionDto {
  projectId: string;
  title: string;
  collectionType: CollectionType;
  collectedAt?: string;
  meetingMinutes?: string;
}

export interface UpdateCollectionDto {
  title?: string;
  collectionType?: CollectionType;
  collectedAt?: string;
  meetingMinutes?: string;
}

export interface RawRequirementInCollection {
  id: string;
  content: string;
  source?: string;
  status: string;
  sessionHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
  followUpQuestions: string[];
  keyElements: string[];
  questionCount: number;
  clarifiedContent?: string;
  clarifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RawRequirementCollectionResponse {
  id: string;
  projectId: string;
  title: string;
  collectionType: CollectionType;
  status: CollectionStatus;
  collectedBy: UserSummary;
  collectedAt: string;
  completedAt?: string;
  meetingMinutes?: string;
  rawRequirementCount: number;
  chatRoundCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RawRequirementCollectionDetail extends RawRequirementCollectionResponse {
  rawRequirements: RawRequirementInCollection[];
}

export interface AddRawRequirementDto {
  content: string;
  source: string;
}

export interface RequirementAnalysisResult {
  summary: string;
  keyElements: string[];
  followUpQuestions: string[];
}

export interface ChatResult {
  assistantMessage: string;
  followUpQuestions: string[];
  isComplete: boolean;
  questionCount?: number;
}

export interface CompleteCollectionResult {
  success: boolean;
  unclarifiedRequirements?: RawRequirementInCollection[];
  message?: string;
}

export const requirementCollectionApi = {
  createCollection: (dto: CreateCollectionDto): Promise<RawRequirementCollectionResponse> => {
    return api.post('/collections', dto);
  },

  getCollections: (projectId: string): Promise<RawRequirementCollectionResponse[]> => {
    return api.get(`/collections?projectId=${projectId}`);
  },

  getCollection: (id: string): Promise<RawRequirementCollectionDetail> => {
    return api.get(`/collections/${id}`);
  },

  updateCollection: (id: string, dto: UpdateCollectionDto): Promise<RawRequirementCollectionResponse> => {
    return api.put(`/collections/${id}`, dto);
  },

  deleteCollection: (id: string): Promise<void> => {
    return api.delete(`/collections/${id}`);
  },

  completeCollection: (id: string): Promise<CompleteCollectionResult> => {
    return api.post(`/collections/${id}/complete`);
  },

  addRawRequirement: (
    collectionId: string,
    dto: AddRawRequirementDto
  ): Promise<any> => {
    return api.post(`/collections/${collectionId}/raw-requirements`, dto);
  },

  getRawRequirements: (collectionId: string): Promise<RawRequirementInCollection[]> => {
    return api.get(`/collections/${collectionId}/raw-requirements`);
  },

  streamAnalyzeRequirement: (
    collectionId: string,
    body: {
      rawRequirementText: string;
      requirementFiles?: Array<{ type: string; data: string; name?: string }>;
      projectAttachments?: Array<{ type: string; data: string; name?: string }>;
      configId?: string;
    }
  ): Promise<Response> => {
    return fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/collections/${collectionId}/analyze/stream`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
  },

  chatCollect: (
    rawRequirementId: string,
    message: string,
    configId?: string
  ): Promise<ChatResult> => {
    return api.post(`/raw-requirements/${rawRequirementId}/chat`, { message, configId });
  },

  clarifyRawRequirement: (
    rawRequirementId: string,
    clarifiedContent: string
  ): Promise<RawRequirementInCollection> => {
    return api.post(`/collections/raw-requirements/${rawRequirementId}/clarify`, { clarifiedContent });
  },

  deleteRawRequirement: (rawRequirementId: string): Promise<void> => {
    return api.delete(`/raw-requirements/${rawRequirementId}`);
  },
};
