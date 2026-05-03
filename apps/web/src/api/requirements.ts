import type {
  RequirementDto,
  RequirementResponseDto,
  RequirementListResponseDto,
  CreateUserStoryDto,
  UpdateUserStoryDto,
  UserStoryResponseDto,
  CreateAcceptanceCriteriaDto,
  UpdateAcceptanceCriteriaDto,
  AcceptanceCriteriaResponseDto,
} from "@req2task/dto";
import api from "./axios";

export interface RequirementListParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
}

export interface ChangeLogItem {
  id: string;
  requirementId: string;
  changeType: string;
  oldValue: string | null;
  newValue: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  comment: string | null;
  changedBy?: {
    id: string;
    displayName: string;
    username: string;
  };
  createdAt: string;
}

export interface ChangeHistoryResponse {
  logs: ChangeLogItem[];
  total: number;
}

export type TransitionOption = string;

export const requirementsApi = {
  getByRawRequirement: (rawRequirementId: string) => {
    return api.get<RequirementResponseDto[]>(
      `/requirements/raw-requirement/${rawRequirementId}/requirements`,
    );
  },

  getListByProject: (projectId: string, params?: RequirementListParams) => {
    const { page = 1, limit = 20, ...rest } = params || {};
    return api.get<RequirementListResponseDto>(
      `/requirements/projects/${projectId}/requirements`,
      { params: { page, limit, ...rest } },
    );
  },

  getListByModule: (moduleId: string, params?: RequirementListParams) => {
    const { page = 1, limit = 20, ...rest } = params || {};
    return api.get<RequirementListResponseDto>(
      `/requirements/modules/${moduleId}/requirements`,
      { params: { page, limit, ...rest } },
    );
  },

  getById: (id: string) =>
    api.get<RequirementResponseDto>(`/requirements/${id}`),

  create: (data: RequirementDto) =>
    api.post<RequirementResponseDto>(`/requirements`, data),

  batchCreate: (requirements: RequirementDto[]) =>
    api.post<RequirementResponseDto[]>(`/requirements/batch`, { requirements }),

  update: (id: string, data: RequirementDto) =>
    api.put<RequirementResponseDto>(`/requirements/${id}`, data),

  delete: (id: string) => api.delete(`/requirements/${id}`),

  getChangeHistory: (id: string) =>
    api.get<ChangeHistoryResponse>(`/requirements/${id}/change-history`),

  getAllowedTransitions: (id: string) =>
    api.get<string[]>(`/requirements/${id}/allowed-transitions`),

  transitionStatus: (id: string, targetStatus: string, comment?: string) =>
    api.post<RequirementResponseDto>(`/requirements/${id}/transition`, {
      targetStatus,
      comment,
    }),

  review: (id: string, approved: boolean, comment?: string) =>
    api.post<RequirementResponseDto>(`/requirements/${id}/review`, {
      approved,
      comment,
    }),
};

export const userStoriesApi = {
  create: (requirementId: string, data: CreateUserStoryDto) =>
    api.post<UserStoryResponseDto>(
      `/user-stories/${requirementId}/user-stories`,
      data,
    ),

  getByRequirement: (requirementId: string) =>
    api.get<UserStoryResponseDto[]>(
      `/user-stories/${requirementId}/user-stories`,
    ),

  update: (id: string, data: UpdateUserStoryDto) =>
    api.put<UserStoryResponseDto>(`/user-stories/${id}`, data),

  delete: (id: string) => api.delete(`/user-stories/${id}`),
};

export const acceptanceCriteriaApi = {
  create: (userStoryId: string, data: CreateAcceptanceCriteriaDto) =>
    api.post<AcceptanceCriteriaResponseDto>(
      `/acceptance-criteria/${userStoryId}/acceptance-criteria`,
      data,
    ),

  getByUserStory: (userStoryId: string) =>
    api.get<AcceptanceCriteriaResponseDto[]>(
      `/acceptance-criteria/${userStoryId}/acceptance-criteria`,
    ),

  update: (id: string, data: UpdateAcceptanceCriteriaDto) =>
    api.put<AcceptanceCriteriaResponseDto>(`/acceptance-criteria/${id}`, data),

  delete: (id: string) => api.delete(`/acceptance-criteria/${id}`),
};
