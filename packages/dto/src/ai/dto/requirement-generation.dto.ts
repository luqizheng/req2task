import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsDateString,
  ValidateNested,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";
import { Priority, CollectionType } from "../../enums";
import { QuestionAndAnswerDto } from "../../conversation/dto";
import { RawRequirementQADto } from "../../raw-requirement";

export class GenerateRequirementsDto {
  @IsString()
  projectId!: string;

  @IsString()
  rawRequirement!: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsArray()
  moduleIds?: string[];
}

export class GenerateUserStoriesDto {
  @IsOptional()
  @IsString()
  featurePoints?: string;

  @IsOptional()
  @IsString()
  context?: string;
}

export class UserStoryDraftDto {
  @IsString()
  role!: string;

  @IsString()
  goal!: string;

  @IsString()
  benefit!: string;

  @IsOptional()
  @IsNumber()
  storyPoints?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AcceptanceCriteriaDraftDto)
  acceptanceCriteria?: AcceptanceCriteriaDraftDto[];
}

export class AcceptanceCriteriaDraftDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  criteriaType?: string;

  @IsOptional()
  @IsString()
  testMethod?: string;
}

export class SaveUserStoriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserStoryDraftDto)
  userStories!: UserStoryDraftDto[];
}

export class GenerateTasksDto {
  @IsString()
  featurePoints!: string;

  @IsOptional()
  @IsString()
  context?: string;
}

export class GenerateAcceptanceCriteriaDto {
  @IsOptional()
  @IsString()
  context?: string;
}

export class GenerateFeaturePointsDto {
  @IsOptional()
  @IsString()
  context?: string;
}

export class GenerateModulesDto {
  @IsString()
  requirements!: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  existingModulesTree?: string;
}

export class GenerateRawRequirementByLLMDto {
  @IsString()
  conversationText!: string;

  @IsOptional()
  @IsArray()
  previousQuestions?: RawRequirementQADto[];
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

  @IsOptional()
  @IsEnum(CollectionType)
  collectionType?: CollectionType;

  @IsOptional()
  @IsDateString()
  collectTime?: string;

  /**
   * 与项目线管的附件。关联到项目附件，它不属于 原始需求
   */
  @IsOptional()
  @IsArray()
  fileIds?: string[];
}

export class AnswerQuestionDto {
  @IsString()
  answer!: string;
}
