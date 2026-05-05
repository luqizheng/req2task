import { IsString, IsOptional, IsNumber, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RecommendModuleDto {
  @IsString()
  content!: string;
}

export class ModuleRecommendItemDto {
  @IsOptional()
  @IsString()
  moduleId!: string | null;

  @IsOptional()
  @IsString()
  moduleName!: string | null;

  @IsNumber()
  @Min(0)
  @Max(1)
  score!: number;

  isNew!: boolean;

  @IsOptional()
  @IsString()
  suggestedName!: string | null;

  @IsOptional()
  @IsString()
  suggestedDescription!: string | null;
}

export class ModuleRecommendResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModuleRecommendItemDto)
  recommendations!: ModuleRecommendItemDto[];
}

export class CreateModuleFromRecommendationDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}

export class AiGeneratedModuleConfirmDto {
  @IsString()
  requirementId!: string;

  @IsOptional()
  @IsString()
  moduleId!: string | null;
}

export class NewModuleSuggestionDto {
  @IsString()
  suggestedName!: string;

  @IsOptional()
  @IsString()
  suggestedDescription?: string;

  @IsArray()
  @IsString({ each: true })
  requirementIds!: string[];
}

export class ConfirmAiModulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiGeneratedModuleConfirmDto)
  confirmations!: AiGeneratedModuleConfirmDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewModuleSuggestionDto)
  newModules!: NewModuleSuggestionDto[];
}

export class ConfirmedModuleResultDto {
  moduleId!: string;
  moduleName!: string;
}

export class ConfirmedRequirementResultDto {
  requirementId!: string;
  moduleId!: string;
}

export class ConfirmAiModulesResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmedModuleResultDto)
  createdModules!: ConfirmedModuleResultDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmedRequirementResultDto)
  updatedRequirements!: ConfirmedRequirementResultDto[];
}
