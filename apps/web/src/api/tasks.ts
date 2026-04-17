import type {
  CreateTaskDto,
  UpdateTaskDto,
  TaskResponseDto,
  TaskListResponseDto,
} from '@req2task/dto';
import api from './axios';

export interface TaskListParams {
  page?: number;
  limit?: number;
}

export interface KanbanColumn {
  status: string;
  label: string;
  tasks: TaskResponseDto[];
}

export interface TaskStatistics {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

export const tasksApi = {
  getListByRequirement: (requirementId: string, params?: TaskListParams) => {
    const { page = 1, limit = 20 } = params || {};
    return api.get<TaskListResponseDto>(
      `/requirements/${requirementId}/tasks`,
      { params: { page, limit } }
    );
  },

  getKanbanBoard: (requirementId: string) =>
    api.get<KanbanColumn[]>(`/requirements/${requirementId}/kanban`),

  getTaskStatistics: (requirementId: string) =>
    api.get<TaskStatistics>(`/requirements/${requirementId}/task-statistics`),

  getById: (id: string) => api.get<TaskResponseDto>(`/tasks/${id}`),

  create: (requirementId: string, data: CreateTaskDto) =>
    api.post<TaskResponseDto>(`/requirements/${requirementId}/tasks`, data),

  update: (id: string, data: UpdateTaskDto) =>
    api.put<TaskResponseDto>(`/tasks/${id}`, data),

  delete: (id: string) => api.delete(`/tasks/${id}`),

  transitionStatus: (id: string, targetStatus: string) =>
    api.post<TaskResponseDto>(`/tasks/${id}/transition`, { targetStatus }),

  getAllowedTransitions: (id: string) =>
    api.get<{ allowedTransitions: string[] }>(`/tasks/${id}/allowed-transitions`),

  addDependency: (id: string, dependencyTaskId: string) =>
    api.post<TaskResponseDto>(`/tasks/${id}/dependencies`, { dependencyTaskId }),

  removeDependency: (id: string, dependencyTaskId: string) =>
    api.delete<TaskResponseDto>(`/tasks/${id}/dependencies/${dependencyTaskId}`),
};
