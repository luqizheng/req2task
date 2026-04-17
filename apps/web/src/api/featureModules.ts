import type {
  CreateFeatureModuleDto,
  UpdateFeatureModuleDto,
  FeatureModuleResponseDto,
  FeatureModuleListResponseDto,
} from '@req2task/dto';
import api from './axios';

export interface FeatureModuleListParams {
  page?: number;
  limit?: number;
}

export const featureModulesApi = {
  getList: (projectId: string, params?: FeatureModuleListParams) => {
    const { page = 1, limit = 100, ...rest } = params || {};
    return api.get<FeatureModuleListResponseDto>(
      `/projects/${projectId}/feature-modules`,
      { params: { page, limit, ...rest } }
    );
  },

  getById: (id: string) =>
    api.get<FeatureModuleResponseDto>(`/feature-modules/${id}`),

  create: (projectId: string, data: CreateFeatureModuleDto) =>
    api.post<FeatureModuleResponseDto>(
      `/projects/${projectId}/feature-modules`,
      data
    ),

  update: (id: string, data: UpdateFeatureModuleDto) =>
    api.put<FeatureModuleResponseDto>(`/feature-modules/${id}`, data),

  delete: (id: string) => api.delete(`/feature-modules/${id}`),
};
