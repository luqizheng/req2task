import { CollectionType, Priority, RawRequirementStatus } from '../enums';

export interface RawRequirementListParams {
  page?: number;
  limit?: number;
  status?: RawRequirementStatus;
}

export interface RawRequirementQADto {
  id: string;
  question: string;
  answer: string | null;
  purpose?: string;
  createdAt: string;
  answeredAt: string | null;
}

export interface RawRequirementResponseDto {
  id: string;
  projectId: string;
  collectionType?: CollectionType;
  conversationId?: string;
  title: string | null;
  content: string;
  source: string;
  collectTime: string | null;
  status: RawRequirementStatus;
  questionAndAnswers: RawRequirementQADto[];
  keyElements: string[];
  createdAt: string;
  updatedAt: string;
  fileIds?: string[];
  priority?: Priority;
}

export interface CreateRawRequirementInput {
  projectId: string;
  content: string;
  source?: string;
  collectionType?: CollectionType;
  collectTime?: string;
}

export interface UpdateRawRequirementDto {
  status?: RawRequirementStatus;
  generatedContent?: string;
  questionAndAnswers?: RawRequirementQADto[];
  keyElements?: string[];
}
