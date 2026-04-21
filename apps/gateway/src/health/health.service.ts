import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NacosService } from '../nacos/nacos.service';
import { Logger } from '../common/utils/logger';
import { HealthStatus, ServiceHealthStatus, InstanceHealthStatus } from '../common/types';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger('Health');
  private startTime: number;

  constructor(
    private readonly nacosService: NacosService,
    private readonly metricsService: MetricsService,
    private readonly configService: ConfigService,
  ) {
    this.startTime = Date.now();
  }

  async checkHealth(): Promise<HealthStatus> {
    const serviceStatuses = await this.checkAllServices();
    const overallStatus = this.determineOverallStatus(serviceStatuses);

    return {
      status: overallStatus,
      timestamp: Date.now(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services: serviceStatuses,
      metrics: this.metricsService.getSystemMetrics(),
    };
  }

  async checkLiveness(): Promise<{ status: string }> {
    return { status: 'ok' };
  }

  async checkReadiness(): Promise<{ status: string; nacosConnected: boolean }> {
    const nacosConnected = this.nacosService.getConnectionStatus();
    
    return {
      status: nacosConnected ? 'ready' : 'degraded',
      nacosConnected,
    };
  }

  private async checkAllServices(): Promise<ServiceHealthStatus[]> {
    const services = ['service', 'ai-chat-service', 'file-conversion'];
    const statuses: ServiceHealthStatus[] = [];

    for (const serviceName of services) {
      const instances = await this.nacosService.selectInstances(serviceName, false);
      
      const instanceStatuses: InstanceHealthStatus[] = instances.map((instance) => ({
        instanceId: instance.instanceId,
        ip: instance.ip,
        port: instance.port,
        status: instance.healthStatus === 'healthy' ? 'up' : 'down',
      }));

      const healthyCount = instanceStatuses.filter((i) => i.status === 'up').length;
      const serviceStatus: ServiceHealthStatus = {
        name: serviceName,
        status: healthyCount > 0 ? 'up' : 'down',
        instances: instanceStatuses,
        lastCheck: Date.now(),
      };

      statuses.push(serviceStatus);
    }

    return statuses;
  }

  private determineOverallStatus(services: ServiceHealthStatus[]): 'healthy' | 'unhealthy' | 'degraded' {
    const upCount = services.filter((s) => s.status === 'up').length;
    const totalCount = services.length;

    if (upCount === totalCount) {
      return 'healthy';
    } else if (upCount > 0) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }
}
