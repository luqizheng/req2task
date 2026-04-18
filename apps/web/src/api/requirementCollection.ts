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

export type RawRequirementStatus = 'pending' | 'processing' | 'completed' | 'failed';

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
  collectedBy: UserSummary;
  collectedAt: string;
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

  addRawRequirement: (
    collectionId: string,
    dto: AddRawRequirementDto,
    moduleId: string
  ): Promise<RawRequirementInCollection> => {
    return api.post(`/collections/${collectionId}/raw-requirements?moduleId=${moduleId}`, dto);
  },

  getRawRequirements: (collectionId: string): Promise<RawRequirementInCollection[]> => {
    return api.get(`/collections/${collectionId}/raw-requirements`);
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
    moduleId: string,
    source: string,
    configId?: string
  ): Promise<{ rawRequirementId: string } & ChatResult> => {
    return api.post(`/collections/${collectionId}/chat`, { message, moduleId, source, configId });
  },
};
