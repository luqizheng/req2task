import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
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

  @IsOptional()
  @IsEnum(SystemType)
  systemType?: SystemType;

  @IsOptional()
  @IsEnum(ArchitectureType)
  architectureType?: ArchitectureType;

  @IsOptional()
  @ValidateNested()
  @Type(() => TechStackDto)
  techStack?: TechStackDto;

  @IsOptional()
  @IsArray()
  @IsEnum(DatabaseType, { each: true })
  databaseTypes?: DatabaseType[];

  @IsOptional()
  @IsEnum(CloudProvider)
  cloudProvider?: CloudProvider;

  @IsOptional()
  @IsEnum(SecurityLevel)
  securityLevel?: SecurityLevel;

  @IsOptional()
  @IsEnum(ProjectScale)
  projectScale?: ProjectScale;

  @IsOptional()
  @IsNumber()
  teamSize?: number;

  @IsOptional()
  @IsBoolean()
  isMicroservices?: boolean;

  @IsOptional()
  @IsNumber()
  expectedDurationMonths?: number;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  businessDomain?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;
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


