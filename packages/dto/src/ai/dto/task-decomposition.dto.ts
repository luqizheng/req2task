import { TaskPriority } from '../../enums';

export class TaskDecompositionDto {
  tasks!: {
    title: string;
    estimatedHours: number;
    priority: TaskPriority;
    dependencies: string[];
    description: string;
  }[];
  totalEstimatedHours!: number;
}

export class WorkloadEstimateDto {
  estimatedHours!: number;
  reasoning!: string;
}

export class SimilarRecommendationDto {
  requirementId!: string;
  content!: string;
  similarity!: number;
  reason!: string;
}
