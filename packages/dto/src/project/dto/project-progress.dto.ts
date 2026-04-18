import { RequirementStatus } from '../../enums';

export class BurndownPointDto {
  date!: string;
  planned!: number;
  actual!: number;
  remainingTasks!: number;
}

export class ProjectProgressDto {
  projectId!: string;
  projectName!: string;
  totalModules!: number;
  totalRequirements!: number;
  completedRequirements!: number;
  requirementProgress!: number;
  totalTasks!: number;
  completedTasks!: number;
  taskProgress!: number;
  totalStoryPoints!: number;
  completedStoryPoints!: number;
  totalEstimatedHours!: number;
  totalActualHours!: number;
  byRequirementStatus!: Record<string, number>;
  byTaskStatus!: Record<string, number>;
  burndownData!: BurndownPointDto[];
}

export class BurndownDataDto {
  projectId!: string;
  startDate!: string;
  endDate!: string;
  totalStoryPoints!: number;
  idealLine!: number[];
  actualLine!: number[];
  remainingTasks!: number[];
}

export class BurndownQueryDto {
  startDate!: string;
  endDate!: string;
}

export class ModuleProgressDto {
  moduleId!: string;
  moduleName!: string;
  totalRequirements!: number;
  completedRequirements!: number;
  progress!: number;
  requirements!: {
    id: string;
    title: string;
    status: RequirementStatus;
    taskCount: number;
    completedTaskCount: number;
  }[];
}
