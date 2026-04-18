import api from './axios';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  email: string;
}

export type CollectionType = 'meeting' | 'interview' | 'document' | 'other';

export type CollectionStatus = 'active' | 'completed';

export type RawRequirementStatus = 'pending' | 'processing' | 'clarified' | 'converted' | 'discarded';

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

export interface RawRequirementInCollection {
  id: string;
  content: string;
  source?: string;
  status: RawRequirementStatus;
  sessionHistory: ChatMessage[];
  followUpQuestions: string[];
  keyElements: string[];
  questionCount: number;
  clarifiedContent?: string;
  clarifiedAt?: string;
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
  ): Promise<RawRequirementInCollection> => {
    return api.post(`/collections/${collectionId}/raw-requirements`, dto);
  },

  getRawRequirements: (collectionId: string): Promise<RawRequirementInCollection[]> => {
    return api.get(`/collections/${collectionId}/raw-requirements`);
  },

  getRawRequirement: (rawRequirementId: string): Promise<RawRequirementInCollection> => {
    return api.get(`/collections/raw-requirements/${rawRequirementId}`);
  },

  getFollowUpQuestions: (rawRequirementId: string): Promise<string[]> => {
    return api.get(`/collections/raw-requirements/${rawRequirementId}/follow-up-questions`);
  },

  chatCollect: (
    rawRequirementId: string,
    message: string,
    configId?: string
  ): Promise<ChatResult> => {
    return api.post(`/collections/raw-requirements/${rawRequirementId}/chat`, { message, configId });
  },

  chatWithCollection: (
    collectionId: string,
    message: string,
    source: string,
    configId?: string
  ): Promise<{ rawRequirementId: string } & ChatResult> => {
    return api.post(`/collections/${collectionId}/chat`, { message, source, configId });
  },

  clarifyRawRequirement: (
    rawRequirementId: string,
    clarifiedContent: string
  ): Promise<RawRequirementInCollection> => {
    return api.post(`/collections/raw-requirements/${rawRequirementId}/clarify`, { clarifiedContent });
  },

  deleteRawRequirement: (rawRequirementId: string): Promise<void> => {
    return api.delete(`/collections/raw-requirements/${rawRequirementId}`);
  },
};
