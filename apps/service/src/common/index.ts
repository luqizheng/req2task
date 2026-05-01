export * from './guards';
export * from './decorators';
export * from './interceptors';
export * from './filters';
export * from './services/permission.service';

export interface ApiResponse<T = any> {
  code: number;
  data?: T;
  message?: string;
}
