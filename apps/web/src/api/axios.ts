import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
const axiosInstance = axios.create({
  baseURL: baseUrl ? `${baseUrl}/api` : '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  time: string
  url: string
  method?: string
  body?: Record<string, unknown>
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const apiResponse = response.data;
    if (!apiResponse.success) {
      return Promise.reject(new Error(apiResponse.message));
    }
    let data = apiResponse.data;
    while (data && typeof data === 'object' && 'code' in data && 'data' in data) {
      data = (data as { code: number; data: unknown }).data;
    }
    return data as never;
  },
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

interface ApiAxiosInstance extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete' | 'patch'> {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
}

const api = axiosInstance as ApiAxiosInstance;

export default api;
