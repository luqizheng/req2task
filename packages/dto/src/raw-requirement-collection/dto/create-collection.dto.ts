import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum CollectionType {
  MEETING = 'meeting',
  INTERVIEW = 'interview',
  DOCUMENT = 'document',
  OTHER = 'other',
}

export class CreateRawRequirementCollectionDto {
  @IsString()
  projectId!: string;

  @IsString()
  title!: string;

  @IsEnum(CollectionType)
  collectionType!: CollectionType;

  @IsOptional()
  @IsDateString()
  collectedAt?: string;

  @IsOptional()
  @IsString()
  meetingMinutes?: string;
}

export class UpdateRawRequirementCollectionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(CollectionType)
  collectionType?: CollectionType;

  @IsOptional()
  @IsDateString()
  collectedAt?: string;

  @IsOptional()
  @IsString()
  meetingMinutes?: string;
}
