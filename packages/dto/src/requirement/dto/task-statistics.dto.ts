import { TaskStatus } from '../../enums';
import { TaskResponseDto } from './task.dto';

export class TaskStatisticsDto {
  total!: number;
  byStatus!: Record<TaskStatus, number>;
  byPriority!: Record<string, number>;
  completedPercentage!: number;
  estimatedHours!: number;
  actualHours!: number;
}

export class WorkloadStatsDto {
  projectId!: string;
  effectiveHours!: number;
  reworkHours!: number;
  wastedHours!: number;
  totalHours!: number;
  taskCounts!: {
    total: number;
    completed: number;
    cancelled: number;
    replaced: number;
  };
}

export class TaskKanbanBoardDto {
  byStatus!: Record<TaskStatus, TaskResponseDto[]>;
}
