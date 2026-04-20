import { IsString, IsOptional, IsEnum, IsUUID, IsInt, Min, Max, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ConversationStatus, MessageRole } from '../enums';

export class SessionFileContentDto {
  @IsString()
  @IsIn(['text', 'docx', 'pdf', 'audio'])
  type!: 'text' | 'docx' | 'pdf' | 'audio';

  @IsString()
  data!: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class SendMessageDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionFileContentDto)
  files?: SessionFileContentDto[];
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
  title!: string | null;
  status!: ConversationStatus;
  conversationType!: string;
  messageCount!: number;
  summary!: string | null;
  metadata!: Record<string, unknown> | null;
  nextConversationId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
  messages?: ConversationMessageDto[];
}

export class ConversationListQueryDto {
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

export class SessionChatResultDto {
  conversationId!: string;
  messageId!: string;
  content!: string;
  followUpQuestions?: string[];
  isComplete?: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class SessionInfoDto {
  id!: string;
  title!: string | null;
  status!: ConversationStatus;
  messageCount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export class CreateSessionOptionsDto {
  title?: string;
  type?: string;
  metadata?: Record<string, unknown>;
}
