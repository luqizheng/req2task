import type {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectResponseDto,
  ProjectListResponseDto,
  ProjectMemberDto,
  AddMemberDto,
} from '@req2task/dto';
import api from './axios';

export interface ProjectListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
}

export const projectsApi = {
  getList: (params: ProjectListParams) => {
    const { page = 1, limit = 10, ...rest } = params;
    return api.get<ProjectListResponseDto>('/projects', {
      params: { page, limit, ...rest },
    });
  },

  getById: (id: string) =>
    api.get<ProjectResponseDto>(`/projects/${id}`),

  getByKey: (projectKey: string) =>
    api.get<ProjectResponseDto>(`/projects/key/${projectKey}`),

  create: (data: CreateProjectDto) =>
    api.post<ProjectResponseDto>('/projects', data),

  update: (id: string, data: UpdateProjectDto) =>
    api.put<ProjectResponseDto>(`/projects/${id}`, data),

  delete: (id: string) => api.delete(`/projects/${id}`),

  getMembers: (id: string) =>
    api.get<ProjectMemberDto[]>(`/projects/${id}/members`),

  addMember: (id: string, data: AddMemberDto) =>
    api.post<ProjectResponseDto>(`/projects/${id}/members`, data),

  removeMember: (id: string, userId: string) =>
    api.delete<ProjectResponseDto>(`/projects/${id}/members/${userId}`),

  getProgress: (id: string) =>
    api.get<ProjectProgressDto>(`/projects/${id}/progress`),

  getBurndown: (id: string, startDate: string, endDate: string) =>
    api.get<BurndownDto>(`/projects/${id}/burndown`, {
      params: { startDate, endDate },
    }),

  getBaselines: (id: string) =>
    api.get<BaselineDto[]>(`/projects/${id}/baselines`),

  createBaseline: (id: string, data: { name: string; description?: string }) =>
    api.post<BaselineDto>(`/projects/${id}/baselines`, data),

  restoreBaseline: (baselineId: string) =>
    api.post(`/projects/baselines/${baselineId}/restore`),

  deleteBaseline: (baselineId: string) =>
    api.delete(`/projects/baselines/${baselineId}`),
};

export interface ProjectProgressDto {
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

export interface BurndownDto {
  projectId: string;
  startDate: string;
  endDate: string;
  totalStoryPoints: number;
  idealLine: number[];
  actualLine: number[];
  remainingTasks: number[];
}

export interface BaselineDto {
  id: string;
  name: string;
  projectId: string;
  description: string | null;
  createdBy: { id: string; name: string };
  createdAt: string;
  snapshotData: SnapshotData;
}

export interface SnapshotData {
  modules?: Array<{ id: string; name: string }>;
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
