import { IsString, IsOptional, IsEnum, IsUUID, IsInt, Min, Max } from 'class-validator';
import { ConversationStatus, MessageRole } from '../enums';

export class CreateConversationDto {
  @IsOptional()
  @IsUUID()
  collectionId?: string;

  @IsOptional()
  @IsUUID()
  rawRequirementId?: string;

  @IsOptional()
  @IsString()
  title?: string;
}

export class SendMessageDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsUUID()
  rawRequirementId?: string;
}

export class UpdateConversationDto {
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @IsOptional()
  @IsString()
  summary?: string;
}

export class ConversationMessageDto {
  id!: string;
  conversationId!: string;
  role!: MessageRole;
  content!: string;
  rawRequirementId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt!: Date;
}

export class QuestionAndAnswerDto {
  id!: string;
  question!: string;
  answer!: string | null;
  createdAt!: string;
  answeredAt!: string | null;
}

export class ExtractedRequirementDto {
  content!: string;
  type!: string;
  priority!: string;
  dependencies!: string[];
  keywords!: string[];
}

export class SendMessageResultDto {
  message!: ConversationMessageDto;
  questionAndAnswers!: QuestionAndAnswerDto[];
  extractedRequirements?: ExtractedRequirementDto[];
  isComplete!: boolean;
}

export class ConversationDto {
  id!: string;
  collectionId!: string | null;
  rawRequirementId!: string | null;
  title!: string | null;
  status!: ConversationStatus;
  messageCount!: number;
  summary!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
  messages?: ConversationMessageDto[];
}

export class ConversationListQueryDto {
  @IsOptional()
  @IsUUID()
  collectionId?: string;

  @IsOptional()
  @IsUUID()
  rawRequirementId?: string;

  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

export class ConversationMessagesQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}
