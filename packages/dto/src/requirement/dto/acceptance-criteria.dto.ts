import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CriteriaType } from '../../enums';

export class CreateAcceptanceCriteriaDto {
  @IsEnum(CriteriaType)
  criteriaType!: CriteriaType;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  testMethod?: string;
}

export class UpdateAcceptanceCriteriaDto {
  @IsOptional()
  @IsEnum(CriteriaType)
  criteriaType?: CriteriaType;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  testMethod?: string;
}

export class AcceptanceCriteriaResponseDto {
  id!: string;
  userStoryId!: string;
  criteriaType!: CriteriaType;
  content!: string;
  testMethod!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
