import type { LoginRequestDto, LoginResponseDto, RegisterRequestDto, RegisterResponseDto } from '@req2task/dto';
import api from './axios';

export const authApi = {
  login: (data: LoginRequestDto) => api.post<LoginResponseDto>('/auth/login', data),
  
  register: (data: RegisterRequestDto) => api.post<RegisterResponseDto>('/auth/register', data),
  
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },
};