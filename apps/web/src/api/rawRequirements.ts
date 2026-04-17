import type { CreateRawRequirementDto } from '@req2task/dto';
import api from './axios';
import type { RawRequirementResponse } from './ai';

export interface RawRequirementListParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const rawRequirementsApi = {
  getByModule: (moduleId: string, params?: RawRequirementListParams) => {
    const { page = 1, limit = 20, ...rest } = params || {};
    return api.get<RawRequirementResponse[]>(
      `/ai/modules/${moduleId}/raw-requirements`,
      { params: { page, limit, ...rest } }
    );
  },

  create: (moduleId: string, data: CreateRawRequirementDto) => {
    return api.post<RawRequirementResponse>(
      `/ai/modules/${moduleId}/raw-requirements`,
      data
    );
  },

  generate: (id: string, configId?: string) => {
    return api.post(`/ai/raw-requirements/${id}/generate`, { configId });
  },

  detectConflicts: (id: string, configId?: string) => {
    return api.post(`/ai/raw-requirements/${id}/detect-conflicts`, { configId });
  },
};
