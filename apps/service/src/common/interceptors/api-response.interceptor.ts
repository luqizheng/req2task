import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  data?: T;
  time: string;
  url: string;
  method?: string;
  body?: Record<string, unknown>;
}

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const now = new Date().toISOString();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: '操作成功',
        data,
        time: now,
        url: request.url,
        method: request.method,
        body: request.body,
      })),
    );
  }
}