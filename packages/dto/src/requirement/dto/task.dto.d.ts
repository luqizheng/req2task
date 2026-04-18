import { TaskStatus, TaskPriority } from '../../enums';
export declare class CreateTaskDto {
    title: string;
    description?: string;
    priority?: TaskPriority;
    assignedToId?: string;
    estimatedHours?: number;
    dueDate?: string;
    parentTaskId?: string;
}
export declare class UpdateTaskDto {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedToId?: string;
    estimatedHours?: number;
    actualHours?: number;
    dueDate?: string;
}
export declare class TaskResponseDto {
    id: string;
    taskNo: string;
    title: string;
    description: string | null;
    requirementId: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignedToId: string | null;
    assignedTo?: {
        id: string;
        displayName: string;
        username: string;
    };
    estimatedHours: number | null;
    actualHours: number | null;
    dueDate: Date | null;
    parentTaskId: string | null;
    createdById: string;
    createdBy?: {
        id: string;
        displayName: string;
        username: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare class TaskListResponseDto {
    items: TaskResponseDto[];
    total: number;
    page: number;
    limit: number;
}
export declare class AddDependencyDto {
    dependencyTaskId: string;
}
