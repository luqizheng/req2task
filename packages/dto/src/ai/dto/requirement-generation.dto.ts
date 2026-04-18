import { IsString, IsOptional } from 'class-validator';
import { Priority } from '../../enums';

export class ChatMessageDto {
  role!: 'user' | 'assistant';
  content!: string;
  timestamp!: string;
}

export class GenerateRequirementResultDto {
  id!: string;
  title!: string;
  description!: string;
  priority!: Priority;
  acceptanceCriteria!: string[];
  userStories!: {
    role: string;
    goal: string;
    benefit: string;
  }[];
}

export class AnalyzeWithFollowUpResultDto {
  summary!: string;
  keyElements!: string[];
  followUpQuestions!: string[];
  sessionHistory!: ChatMessageDto[];
}

export class ChatCollectResultDto {
  assistantMessage!: string;
  followUpQuestions!: string[];
  isComplete!: boolean;
}

export class CreateRawRequirementDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  source?: string;
}
