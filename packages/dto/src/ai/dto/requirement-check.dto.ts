import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RequirementCheckItemDto {
  @IsString()
  id!: string;

  @IsString()
  title!: string;

  @IsString()
  content!: string;
}

export class SimilarRequirementDto {
  id!: string;
  title!: string;
  content!: string;
  score!: number;
}

export class RequirementCheckResultItemDto {
  requirementId!: string;
  hasDuplicate!: boolean;
  duplicateRequirements!: SimilarRequirementDto[];
  hasConflict!: boolean;
  conflictDescription?: string;
  conflictRequirements!: SimilarRequirementDto[];
}

export class RequirementCheckRequestDto {
  @IsString()
  projectId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequirementCheckItemDto)
  requirements!: RequirementCheckItemDto[];
}

export class RequirementCheckResponseDto {
  results!: RequirementCheckResultItemDto[];
  totalDuplicates!: number;
  totalConflicts!: number;
}
