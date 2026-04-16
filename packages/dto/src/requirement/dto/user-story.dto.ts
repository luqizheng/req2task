import {
  IsString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { AcceptanceCriteriaSummaryDto } from './acceptance-criteria-summary.dto';

export class CreateUserStoryDto {
  @IsString()
  role!: string;

  @IsString()
  goal!: string;

  @IsString()
  benefit!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  storyPoints?: number;
}

export class UpdateUserStoryDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  benefit?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  storyPoints?: number;
}

export class UserStoryResponseDto {
  id!: string;
  requirementId!: string;
  role!: string;
  goal!: string;
  benefit!: string;
  storyPoints!: number;
  acceptanceCriteria?: AcceptanceCriteriaSummaryDto[];
  createdAt!: Date;
  updatedAt!: Date;
}
