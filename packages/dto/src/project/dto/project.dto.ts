import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ProjectStatus } from '../../enums';

export class CreateProjectDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  projectKey!: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ProjectMemberDto {
  id!: string;
  username!: string;
  displayName!: string;
  email!: string;
}

export class ProjectResponseDto {
  id!: string;
  name!: string;
  description!: string | null;
  projectKey!: string;
  status!: ProjectStatus;
  startDate!: Date | null;
  endDate!: Date | null;
  ownerId!: string;
  members!: ProjectMemberDto[];
  createdAt!: Date;
  updatedAt!: Date;
}

export class ProjectListResponseDto {
  items!: ProjectResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}

export class AddMemberDto {
  @IsString()
  userId!: string;
}
