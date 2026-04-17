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

export class CreateBaselineDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class BaselineDetailDto {
  id!: string;
  name!: string;
  projectId!: string;
  description!: string | null;
  createdBy!: {
    id: string;
    name: string;
  };
  createdAt!: Date;
  snapshotData!: SnapshotData;
}

export interface SnapshotData {
  modules?: Array<{
    id: string;
    name: string;
  }>;
  requirements?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    storyPoints: number;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    estimatedHours: number | null;
  }>;
  timestamp?: string;
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  totalModules: number;
  totalRequirements: number;
  completedRequirements: number;
  requirementProgress: number;
  totalTasks: number;
  completedTasks: number;
  taskProgress: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  byRequirementStatus: Record<string, number>;
  byTaskStatus: Record<string, number>;
  burndownData: BurndownPoint[];
}

export interface BurndownPoint {
  date: string;
  planned: number;
  actual: number;
  remainingTasks: number;
}

export interface BurndownData {
  projectId: string;
  startDate: string;
  endDate: string;
  totalStoryPoints: number;
  idealLine: number[];
  actualLine: number[];
  remainingTasks: number[];
}

export interface ModuleProgress {
  moduleId: string;
  moduleName: string;
  totalRequirements: number;
  completedRequirements: number;
  progress: number;
  requirements: {
    id: string;
    title: string;
    status: string;
    taskCount: number;
    completedTaskCount: number;
  }[];
}
