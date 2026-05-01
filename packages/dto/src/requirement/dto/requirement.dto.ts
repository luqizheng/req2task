import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsArray,
} from 'class-validator';
import {
  Priority,
  RequirementSource,
  RequirementStatus,
} from '../../enums';
import { AcceptanceCriteriaSummaryDto } from './acceptance-criteria-summary.dto';

export class ModuleSummaryDto {
  id!: string;
  name!: string;
  moduleKey!: string;
  path!: string | null;
}

export class RequirementDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsEnum(RequirementSource)
  source?: RequirementSource;

  @IsOptional()
  @IsEnum(RequirementStatus)
  status?: RequirementStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  storyPoints?: number;

  @IsOptional()
  @IsString()
  parentRequirementId?: string;

  @IsOptional()
  @IsString()
  sourceRawRequirementId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  moduleIds?: string[];
}

export class UserSummaryDto {
  id!: string;
  displayName!: string;
  username!: string;
}

export class UserStorySummaryDto {
  id!: string;
  role!: string;
  goal!: string;
  benefit!: string;
  storyPoints!: number;
  acceptanceCriteria?: AcceptanceCriteriaSummaryDto[];
}

export class ChildRequirementSummaryDto {
  id!: string;
  title!: string;
  priority!: Priority;
  status!: RequirementStatus;
}

export class RequirementResponseDto {
  id!: string;
  entityKey!: string;
  modules!: ModuleSummaryDto[];
  title!: string;
  description!: string | null;
  priority!: Priority;
  source!: RequirementSource;
  status!: RequirementStatus;
  storyPoints!: number;
  parentId!: string | null;
  createdById!: string;
  createdBy?: UserSummaryDto;
  userStories?: UserStorySummaryDto[];
  userStoryCount?: number;
  children?: ChildRequirementSummaryDto[];
  childCount?: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export class RequirementCardDto {
  id!: string;
  entityKey!: string;
  title!: string;
  priority!: Priority;
  status!: RequirementStatus;
  storyPoints!: number;
  modules?: ModuleSummaryDto[];
}

export class RequirementListResponseDto {
  items!: RequirementResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}
