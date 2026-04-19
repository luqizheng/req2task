import { CollectionType } from './create-collection.dto';
import { RawRequirementStatus } from '../../enums/raw-requirement-status.enum';
import { UserResponseDto } from '../../user/dto';
import { QuestionAndAnswerDto, ConversationMessageDto } from '../../conversation/dto';

export enum CollectionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

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
  mainConversationId?: string;
  rawRequirementCount!: number;
  chatRoundCount!: number;
  createdAt!: string;
  updatedAt!: string;
}

export class RawRequirementCollectionDetailDto extends RawRequirementCollectionResponseDto {
  rawRequirements!: RawRequirementInCollectionDto[];
}

export class RawRequirementInCollectionDto {
  id!: string;
  content!: string;
  status!: RawRequirementStatus;
  questionAndAnswers!: QuestionAndAnswerDto[];
  keyElements!: string[];
  createdAt!: string;
  updatedAt!: string;
}

export class AddRawRequirementDto {
  content!: string;
  source!: string;
}

export class RawRequirementResponseDto {
  id!: string;
  collectionId!: string;
  conversationId?: string;
  content!: string;
  source!: string;
  status!: RawRequirementStatus;
  questionAndAnswers!: QuestionAndAnswerDto[];
  keyElements!: string[];
  analysisResult?: RequirementAnalysisResult;
  createdAt!: string;
  updatedAt!: string;
}

export class RequirementAnalysisResult {
  summary!: string;
  keyElements!: string[];
  questionAndAnswers!: QuestionAndAnswerDto[];
  generatedRequirementId?: string;
}

export class CollectionChatRequestDto {
  collectionId!: string;
  message!: string;
  rawRequirementId?: string;
}

export class CollectionChatResponseDto {
  message!: ConversationMessageDto;
  rawRequirementId!: string;
  questionAndAnswers!: QuestionAndAnswerDto[];
  analysisResult?: RequirementAnalysisResult;
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
