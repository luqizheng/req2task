import { CollectionType, RawRequirementStatus } from '../enums';

export interface RawRequirementQADto {
  id: string;
  question: string;
  answer: string | null;
  createdAt: string;
  answeredAt: string | null;
}

export interface RawRequirementResponseDto {
  id: string;
  projectId: string;
  collectionType?: CollectionType;
  conversationId?: string;
  content: string;
  source: string;
  status: RawRequirementStatus;
  questionAndAnswers: RawRequirementQADto[];
  keyElements: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRawRequirementInput {
  projectId: string;
  content: string;
  source?: string;
  collectionType?: CollectionType;
}

export interface UpdateRawRequirementDto {
  status?: RawRequirementStatus;
  generatedContent?: string;
  questionAndAnswers?: RawRequirementQADto[];
  keyElements?: string[];
}
