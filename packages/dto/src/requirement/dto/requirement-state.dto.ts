import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { RequirementStatus } from '@req2task/core';

export class TransitionStatusDto {
  @IsEnum(RequirementStatus)
  targetStatus!: RequirementStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class ReviewRequirementDto {
  @IsBoolean()
  approved!: boolean;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class AllowedTransitionsDto {
  allowedTransitions!: RequirementStatus[];
}

export class RequirementChangeLogDto {
  id!: string;
  requirementId!: string;
  changeType!: string;
  oldValue!: string | null;
  newValue!: string | null;
  fromStatus!: RequirementStatus | null;
  toStatus!: RequirementStatus | null;
  comment!: string | null;
  changedBy!: {
    id: string;
    displayName: string;
    username: string;
  };
  createdAt!: Date;
}

export class ChangeHistoryResponseDto {
  logs!: RequirementChangeLogDto[];
  total!: number;
}
