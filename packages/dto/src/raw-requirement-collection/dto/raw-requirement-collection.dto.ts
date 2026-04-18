import { CollectionType } from './create-collection.dto';
import { RawRequirementStatus } from '../../enums/raw-requirement-status.enum';
import { UserResponseDto } from '../../user/dto';

export class RawRequirementCollectionResponseDto {
  id!: string;
  projectId!: string;
  title!: string;
  collectionType!: CollectionType;
  status!: CollectionStatus;
  collectedBy!: UserResponseDto;
  collectedAt!: string;
  completedAt?: string;
  meetingMinutes?: string;
  rawRequirementCount!: number;
  chatRoundCount!: number;
  createdAt!: string;
  updatedAt!: string;
}

export enum CollectionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export class RawRequirementCollectionDetailDto extends RawRequirementCollectionResponseDto {
  rawRequirements!: RawRequirementInCollectionDto[];
}

export class RawRequirementInCollectionDto {
  id!: string;
  content!: string;
  status!: RawRequirementStatus;
  sessionHistory!: ChatMessage[];
  followUpQuestions!: string[];
  keyElements!: string[];
  questionCount!: number;
  clarifiedContent?: string;
  clarifiedAt?: string;
  createdAt!: string;
  updatedAt!: string;
}

export class ChatMessage {
  role!: 'user' | 'assistant';
  content!: string;
  timestamp!: string;
}

export class AddRawRequirementDto {
  content!: string;
  source!: string;
}

export class RawRequirementResponseDto {
  id!: string;
  collectionId!: string;
  content!: string;
  source!: string;
  status!: RawRequirementStatus;
  sessionHistory!: ChatMessage[];
  followUpQuestions!: string[];
  keyElements!: string[];
  questionCount!: number;
  clarifiedContent?: string;
  clarifiedAt?: string;
  analysisResult?: RequirementAnalysisResult;
  createdAt!: string;
  updatedAt!: string;
}

export class RequirementAnalysisResult {
  summary!: string;
  keyElements!: string[];
  followUpQuestions!: string[];
  generatedRequirementId?: string;
}

export class FollowUpQuestionDto {
  question!: string;
  context!: string;
}

export class CollectionChatRequestDto {
  collectionId!: string;
  message!: string;
  rawRequirementId?: string;
}

export class CollectionChatResponseDto {
  message!: ChatMessage;
  rawRequirementId!: string;
  followUpQuestions!: FollowUpQuestionDto[];
  analysisResult?: RequirementAnalysisResult;
  questionCount?: number;
}

export class ConvertToRequirementDto {
  rawRequirementId!: string;
  moduleId!: string;
  title?: string;
  description?: string;
  priority?: string;
}

export class ClarifyRawRequirementDto {
  clarifiedContent!: string;
}

export class CompleteCollectionResultDto {
  success!: boolean;
  unclarifiedRequirements?: RawRequirementInCollectionDto[];
  message?: string;
}
