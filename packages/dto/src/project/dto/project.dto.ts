import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ProjectStatus, SystemType, ArchitectureType, DatabaseType, CloudProvider, SecurityLevel, ProjectScale } from '../../enums';
import { TechStackDto } from './wizard.dto';

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
  systemType?: SystemType | null;
  architectureType?: ArchitectureType | null;
  techStack?: TechStackDto | null;
  databaseTypes?: DatabaseType[];
  cloudProvider?: CloudProvider | null;
  securityLevel?: SecurityLevel | null;
  projectScale?: ProjectScale | null;
  teamSize?: number | null;
  isMicroservices?: boolean;
  expectedDurationMonths?: number | null;
  budget?: number | null;
  businessDomain?: string | null;
  targetAudience?: string | null;
  wizardCompleted?: boolean;
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


