import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Logger } from '../common/utils/logger';
import { RouterService } from '../router/router.service';
import { LoadBalancerService } from '../loadbalancer/loadbalancer.service';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { TracingService } from '../tracing/tracing.service';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger('ProxyService');
  private readonly defaultTimeout = 30000;

  constructor(
    private readonly routerService: RouterService,
    private readonly loadBalancerService: LoadBalancerService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly tracingService: TracingService,
    private readonly configService: ConfigService,
  ) {}

  async forward(
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: any,
    query?: Record<string, any>,
  ): Promise<AxiosResponse> {
    const requestId = this.tracingService.generateRequestId();
    const traceId = this.tracingService.getTraceId();
    
    const routeMatch = this.routerService.findRoute(path, method);
    if (!routeMatch.matched || !routeMatch.rule) {
      throw new HttpException('Route not found', HttpStatus.NOT_FOUND);
    }

    const route = routeMatch.rule;

    if (route.serviceName === 'gateway') {
      return this.handleGatewayRequest(method, path, headers) as any;
    }

    if (this.circuitBreakerService.isOpen(route.serviceName)) {
      this.logger.warn(`服务 ${route.serviceName} 熔断器已打开`);
      throw new HttpException('Service temporarily unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const instance = await this.loadBalancerService.selectInstance(route.serviceName);
    if (!instance) {
      this.logger.error(`服务 ${route.serviceName} 没有可用实例`);
      this.circuitBreakerService.recordFailure(route.serviceName);
      throw new HttpException('No available instances', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const targetUrl = `http://${instance.ip}:${instance.port}${path}`;
    const timeout = route.timeout || this.defaultTimeout;

    const requestHeaders = this.buildHeaders(headers, requestId, traceId);

    const config: AxiosRequestConfig = {
      method,
      url: targetUrl,
      headers: requestHeaders,
      timeout,
      params: query,
      validateStatus: () => true,
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      config.data = body;
    }

    try {
      this.logger.debug(`转发请求: ${method} ${targetUrl}`);
      const response = await axios(config);
      
      if (response.status >= 500) {
        this.circuitBreakerService.recordFailure(route.serviceName);
        this.logger.error(`后端服务返回错误: ${response.status}`);
      } else if (response.status < 400) {
        this.circuitBreakerService.recordSuccess(route.serviceName);
      }

      return response;
    } catch (error) {
      this.circuitBreakerService.recordFailure(route.serviceName);
      this.logger.error(`请求转发失败: ${error.message}`);
      throw new HttpException('Proxy error', HttpStatus.BAD_GATEWAY);
    }
  }

  private handleGatewayRequest(
    _method: string,
    path: string,
    _headers: Record<string, string>,
  ): unknown {
    if (path.startsWith('/api/health')) {
      return {
        status: 200,
        data: { status: 'ok' },
        headers: { 'content-type': 'application/json' },
      };
    }

    throw new HttpException('Gateway route not handled', HttpStatus.NOT_FOUND);
  }

  private buildHeaders(
    originalHeaders: Record<string, string>,
    requestId: string,
    traceId: string,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Request-Id': requestId,
      'X-Trace-Id': traceId,
      'X-Forwarded-For': originalHeaders['x-forwarded-for'] || 'unknown',
      'X-Real-IP': originalHeaders['x-real-ip'] || 'unknown',
    };

    const passHeaders = [
      'authorization',
      'content-type',
      'accept',
      'user-agent',
      'referer',
      'origin',
    ];

    passHeaders.forEach((key) => {
      if (originalHeaders[key]) {
        headers[key] = originalHeaders[key];
      }
    });

    return headers;
  }

  async streamForward(
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: any,
  ): Promise<any> {
    const routeMatch = this.routerService.findRoute(path, method);
    if (!routeMatch.matched || !routeMatch.rule) {
      throw new HttpException('Route not found', HttpStatus.NOT_FOUND);
    }

    const route = routeMatch.rule;
    const instance = await this.loadBalancerService.selectInstance(route.serviceName);
    
    if (!instance) {
      throw new HttpException('No available instances', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const targetUrl = `http://${instance.ip}:${instance.port}${path}`;
    return axios({
      method,
      url: targetUrl,
      headers: this.buildHeaders(headers, '', ''),
      data: body,
      responseType: 'stream',
      timeout: route.timeout || this.defaultTimeout,
    });
  }
}
