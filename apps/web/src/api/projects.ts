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
};
