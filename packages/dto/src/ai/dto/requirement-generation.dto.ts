import { IsString, IsOptional } from 'class-validator';

export class CreateRawRequirementDto {
  @IsString()
  content!: string;
}

export class GenerateRequirementResponseDto {
  id!: string;
  title!: string;
  description!: string;
  priority!: string;
  acceptanceCriteria!: string[];
  userStories!: {
    role: string;
    goal: string;
    benefit: string;
  }[];
}

export class GenerateUserStoriesDto {
  @IsString()
  requirementContent!: string;

  @IsOptional()
  @IsString()
  configId?: string;
}

export class GenerateAcceptanceCriteriaDto {
  @IsString()
  requirementContent!: string;

  @IsOptional()
  @IsString()
  configId?: string;
}
