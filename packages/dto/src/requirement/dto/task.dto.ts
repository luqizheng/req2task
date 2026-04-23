import {
  IsString,
  IsOptional,
  IsEnum,
  Min,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { TaskStatus, TaskPriority } from '../../enums';

export class CreateTaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  parentTaskId?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualHours?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class TaskResponseDto {
  id!: string;
  taskNo!: string;
  title!: string;
  description!: string | null;
  requirementId!: string;
  status!: TaskStatus;
  priority!: TaskPriority;
  assignedToId!: string | null;
  assignedTo?: {
    id: string;
    displayName: string;
    username: string;
  };
  estimatedHours!: number | null;
  actualHours!: number | null;
  dueDate!: Date | null;
  parentTaskId!: string | null;
  createdById!: string;
  createdBy?: {
    id: string;
    displayName: string;
    username: string;
  };
  createdAt!: Date;
  updatedAt!: Date;
}

export class TaskListResponseDto {
  items!: TaskResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}

export class AddDependencyDto {
  @IsString()
  dependencyTaskId!: string;
}
