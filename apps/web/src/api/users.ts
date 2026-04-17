import type {
  CreateUserDto,
  UpdateUserDto,
  UpdateMeDto,
  ChangePasswordDto,
  UserResponseDto,
  UserListResponseDto,
} from '@req2task/dto';
import api from './axios';

export interface UserListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  role?: string;
  status?: number;
}

export const usersApi = {
  getList: (params: UserListParams) => {
    const { page = 1, limit = 10, ...rest } = params;
    return api.get<UserListResponseDto>('/users', {
      params: { page, limit, ...rest },
    });
  },

  getMe: () => api.get<UserResponseDto>('/users/me'),

  getById: (id: string) => api.get<UserResponseDto>(`/users/${id}`),

  create: (data: CreateUserDto) => api.post<UserResponseDto>('/users', data),

  update: (id: string, data: UpdateUserDto) =>
    api.put<UserResponseDto>(`/users/${id}`, data),

  delete: (id: string) => api.delete(`/users/${id}`),

  updateMe: (data: UpdateMeDto) => api.put<UserResponseDto>('/users/me', data),

  changePassword: (data: ChangePasswordDto) =>
    api.put('/users/me/password', data),
};
