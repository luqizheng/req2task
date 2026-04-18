import { ProjectStatus } from '../../enums';
export declare class CreateProjectDto {
    name: string;
    description?: string;
    projectKey: string;
    status?: ProjectStatus;
    startDate?: string;
    endDate?: string;
}
export declare class UpdateProjectDto {
    name?: string;
    description?: string;
    status?: ProjectStatus;
    startDate?: string;
    endDate?: string;
}
export declare class ProjectMemberDto {
    id: string;
    username: string;
    displayName: string;
    email: string;
}
export declare class ProjectResponseDto {
    id: string;
    name: string;
    description: string | null;
    projectKey: string;
    status: ProjectStatus;
    startDate: Date | null;
    endDate: Date | null;
    ownerId: string;
    members: ProjectMemberDto[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class ProjectListResponseDto {
    items: ProjectResponseDto[];
    total: number;
    page: number;
    limit: number;
}
export declare class AddMemberDto {
    userId: string;
}
export declare class CreateBaselineDto {
    name: string;
    description?: string;
}
export declare class BaselineDetailDto {
    id: string;
    name: string;
    projectId: string;
    description: string | null;
    createdBy: {
        id: string;
        name: string;
    };
    createdAt: Date;
    snapshotData: SnapshotData;
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
