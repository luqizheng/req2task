import { IsString, IsOptional } from 'class-validator';
import { Priority } from '../../enums';
import { QuestionAndAnswerDto } from '../../conversation/dto';

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
  questionAndAnswers!: QuestionAndAnswerDto[];
}

export class ChatCollectResultDto {
  assistantMessage!: string;
  questionAndAnswers!: QuestionAndAnswerDto[];
  isComplete!: boolean;
}

export class CreateRawRequirementDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  source?: string;
}

export class AnswerQuestionDto {
  @IsString()
  answer!: string;
}
