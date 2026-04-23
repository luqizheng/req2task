import { RequirementStatus, TaskStatus } from '../../enums';

export class CreateBaselineDto {
  name!: string;
  description?: string | null;
}

export class BaselineDto {
  id!: string;
  name!: string;
  projectId!: string;
  description!: string | null;
  createdBy!: {
    id: string;
    name: string;
  };
  createdAt!: Date;
  snapshotData!: SnapshotDataDto;
}

export interface SnapshotDataDto {
  [key: string]: unknown;
  modules?: Array<{
    id: string;
    name: string;
  }>;
  requirements?: Array<{
    id: string;
    title: string;
    status: RequirementStatus;
    priority: string;
    storyPoints: number;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    priority: string;
    estimatedHours: number | null;
  }>;
  timestamp?: string;
}

export class BaselineComparisonDto {
  baseline1!: BaselineDto;
  baseline2!: BaselineDto;
  differences!: {
    requirementsAdded: string[];
    requirementsRemoved: string[];
    requirementsChanged: Array<{
      id: string;
      title: string;
      changes: Record<string, { from: unknown; to: unknown }>;
    }>;
    tasksAdded: string[];
    tasksRemoved: string[];
    tasksChanged: Array<{
      id: string;
      title: string;
      changes: Record<string, { from: unknown; to: unknown }>;
    }>;
  };
}
