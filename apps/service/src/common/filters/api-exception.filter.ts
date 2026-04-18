import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { BusinessException } from '@req2task/core';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '未知错误';

    const businessException = exception as BusinessException;
    if (businessException.statusCode !== undefined && businessException.message) {
      status = businessException.statusCode;
      message = businessException.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as { message?: string }).message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorInfo = {
      status,
      message,
      url: request.url,
      method: request.method,
      body: request.body,
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    this.logger.error(
      `HTTP ${status} Error: ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      success: false,
      message,
      time: new Date().toISOString(),
      ...errorInfo,
    });
  }
}