import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import os from "os";
import { Logger } from "../common/utils/logger";
import { ServiceInstance } from "../common/types";
import { NacosInstance } from "./nacos.interfaces";

@Injectable()
export class NacosService implements OnApplicationBootstrap, OnModuleDestroy {
  private connectionReadyPromise: Promise<void>;
  private resolveConnectionReady!: () => void;
  private isConnected = false;
  private readonly logger = new Logger("NacosService");
  private instanceCache = new Map<
    string,
    { instances: ServiceInstance[]; timestamp: number }
  >();
  private readonly CACHE_TTL = 5000;
  private readonly HEARTBEAT_INTERVAL = 15000;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private subscriptionCallbacks = new Map<
    string,
    (instances: ServiceInstance[]) => void
  >();
  private configSubscriptionCallbacks = new Map<
    string,
    (config: string) => void
  >();
  private readonly gatewayServiceName = "api-gateway";
  private readonly gatewayInstanceId: string;
  private configHistory: Map<string, { value: string; timestamp: number }[]> =
    new Map();
  private nacosServerAddr = "";
  private nacosNamespace = "";
  private nacosGroup = "DEFAULT_GROUP";

  constructor(private readonly configService: ConfigService) {
    this.gatewayInstanceId = `gateway-${process.pid}-${Date.now()}`;
    this.connectionReadyPromise = new Promise((resolve) => {
      this.resolveConnectionReady = resolve;
    });
  }

  async onApplicationBootstrap() {
    this.logger.log(">>> [onApplicationBootstrap] 开始");
    await this.connect();
    this.logger.log(`>>> [onApplicationBootstrap] 完成, isConnected=${this.isConnected}`);
  }

  async onModuleDestroy() {
    await this.shutdown();
  }

  private async connect() {
    const nacosHost = this.configService.get("NACOS_HOST", "localhost");
    const nacosPort = this.configService.get("NACOS_PORT", "8848");
    this.nacosServerAddr = `${nacosHost}:${nacosPort}`;
    this.nacosNamespace = this.configService.get("NACOS_NAMESPACE", "");
    this.nacosGroup = this.configService.get("NACOS_GROUP", "DEFAULT_GROUP");

    this.logger.log(`正在连接 Nacos: ${this.nacosServerAddr}`);
    this.logger.log(
      `Namespace: ${this.nacosNamespace || "(默认)"}, Group: ${this.nacosGroup}`,
    );

    try {
      const healthUrl = `http://${this.nacosServerAddr}/nacos/v1/console/health/readiness`;
      this.logger.log(`>>> [connect] Health Check URL: ${healthUrl}`);

      const response = await axios.get(healthUrl, { timeout: 3000 });
      this.logger.log(`>>> [connect] Health Response: ${JSON.stringify(response.data)}`);
      this.logger.log(`>>> [connect] Health Response status: ${response.status}`);
      this.logger.log(`>>> [connect] Health Response data type: ${typeof response.data}`);
      this.logger.log(`>>> [connect] Health Response data keys: ${Object.keys(response.data || {})}`);

      const isReady = response.data?.readiness === true || response.data === "OK";
      this.logger.log(`>>> [connect] Health Check 结果: isReady=${isReady}`);
      
      if (isReady) {
        this.isConnected = true;
        this.logger.log("Nacos 服务器连接成功");
        this.startHeartbeat();
        await this.registerGateway();
      } else {
        this.logger.warn(`Nacos Health Check 未通过，将使用本地配置模式`);
      }
      this.resolveConnectionReady?.();
    } catch (error: any) {
      const errDetail =
        error.code === "ECONNREFUSED"
          ? "连接被拒绝"
          : error.code === "ETIMEDOUT"
            ? "连接超时"
            : error.response
              ? `HTTP ${error.response.status}`
              : error.message;
      this.logger.warn(
        `Nacos 连接失败 [${errDetail}]: ${error.message}，将使用本地配置模式`,
      );
      this.resolveConnectionReady();
    }
  }

  private handleServiceChange(serviceName: string, instances: NacosInstance[]) {
    const serviceInstances = instances.map((inst) =>
      this.mapToServiceInstance(inst),
    );
    this.instanceCache.set(serviceName, {
      instances: serviceInstances,
      timestamp: Date.now(),
    });

    const callback = this.subscriptionCallbacks.get(serviceName);
    if (callback) {
      callback(serviceInstances);
    }
  }

  private mapToServiceInstance(inst: NacosInstance): ServiceInstance {
    return {
      instanceId: inst.instanceId || `${inst.ip}:${inst.port}`,
      ip: inst.ip,
      port: inst.port,
      serviceName: inst.serviceName || "",
      healthStatus: inst.healthy ? "healthy" : "unhealthy",
      weight: inst.weight || 1,
      enabled: inst.enabled ?? true,
      ephemeral: inst.ephemeral ?? true,
      clusterName: inst.clusterName || "DEFAULT",
      metadata: inst.metadata || {},
      lastHeartbeat: Date.now(),
    };
  }

  async registerGateway(): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn("Nacos 未连接，跳过网关注册");
      return false;
    }

    const port = this.configService.get("PORT", 3000);
    const clusterName = this.configService.get("NACOS_CLUSTER", "DEFAULT");

    const instance: NacosInstance = {
      instanceId: this.gatewayInstanceId,
      ip: this.getLocalIP(),
      port: Number(port),
      serviceName: this.gatewayServiceName,
      healthy: true,
      enabled: true,
      ephemeral: true,
      clusterName,
      weight: 1,
      metadata: {
        "gateway.version": "1.0.0",
        "gateway.node": process.pid.toString(),
      },
    };

    try {
      await axios.post(
        `http://${this.nacosServerAddr}/nacos/v1/ns/instance`,
        null,
        {
          params: {
            serviceName: this.gatewayServiceName,
            ip: instance.ip,
            port: instance.port,
            clusterName: instance.clusterName,
            weight: instance.weight,
            healthy: instance.healthy,
            enabled: instance.enabled,
            ephemeral: instance.ephemeral,
            namespaceId: this.nacosNamespace,
            groupName: this.nacosGroup,
            metadata: JSON.stringify(instance.metadata),
          },
        },
      );
      this.logger.log(`网关实例注册成功: ${instance.ip}:${instance.port}`);
      return true;
    } catch (error: any) {
      this.logger.error(`网关实例注册失败: ${error.message}`);
      return false;
    }
  }

  async deregisterGateway(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await axios.delete(
        `http://${this.nacosServerAddr}/nacos/v1/ns/instance`,
        {
          params: {
            serviceName: this.gatewayServiceName,
            ip: this.getLocalIP(),
            port: this.configService.get("PORT", 3000),
            namespaceId: this.nacosNamespace,
            groupName: this.nacosGroup,
          },
        },
      );
      this.logger.log("网关实例注销成功");
    } catch (error: any) {
      this.logger.error(`网关实例注销失败: ${error.message}`);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      if (!this.isConnected) return;

      try {
        await axios.put(
          `http://${this.nacosServerAddr}/nacos/v1/ns/instance/beat`,
          null,
          {
            params: {
              serviceName: this.gatewayServiceName,
              ip: this.getLocalIP(),
              port: this.configService.get("PORT", 3000),
              beat: JSON.stringify({
                ip: this.getLocalIP(),
                port: this.configService.get("PORT", 3000),
                serviceName: this.gatewayServiceName,
              }),
              namespaceId: this.nacosNamespace,
              groupName: this.nacosGroup,
            },
          },
        );
      } catch (error: any) {
        this.logger.warn(`心跳发送失败: ${error.message}`);
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  async selectInstances(
    serviceName: string,
    healthy = true,
  ): Promise<ServiceInstance[]> {
    const cached = this.instanceCache.get(serviceName);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return healthy
        ? cached.instances.filter((i) => i.healthStatus === "healthy")
        : cached.instances;
    }

    if (!this.isConnected) {
      this.logger.warn(`Nacos 未连接，服务 ${serviceName} 使用 fallback 实例`);
      return this.getFallbackInstances(serviceName);
    }

    try {
      const response = await axios.get(
        `http://${this.nacosServerAddr}/nacos/v1/ns/instance/list`,
        {
          params: {
            serviceName,
            namespaceId: this.nacosNamespace,
            groupName: this.nacosGroup,
            healthyOnly: healthy,
          },
        },
      );

      const instances: NacosInstance[] = [];
      if (response.data?.hosts) {
        response.data.hosts.forEach((host: any) => {
          instances.push({
            instanceId: host.instanceId,
            ip: host.ip,
            port: host.port,
            serviceName,
            healthy: host.healthy,
            enabled: host.enabled,
            weight: host.weight,
            clusterName: host.clusterName,
            metadata: host.metadata || {},
          });
        });
      }

      const serviceInstances = instances.map((inst) =>
        this.mapToServiceInstance(inst),
      );
      this.instanceCache.set(serviceName, {
        instances: serviceInstances,
        timestamp: Date.now(),
      });
      return serviceInstances;
    } catch (error: any) {
      this.logger.error(`服务发现失败 ${serviceName}: ${error.message}`);
      return this.getFallbackInstances(serviceName);
    }
  }

  private getFallbackInstances(serviceName: string): ServiceInstance[] {
    const fallbackConfigs: Record<string, ServiceInstance[]> = {
      service: [
        {
          instanceId: "fallback-service-1",
          ip: "localhost",
          port: 4000,
          serviceName: "service",
          healthStatus: "healthy",
          weight: 1,
          enabled: true,
          ephemeral: false,
          clusterName: "DEFAULT",
          metadata: {},
          lastHeartbeat: Date.now(),
        },
      ],
      "ai-chat-service": [
        {
          instanceId: "fallback-ai-1",
          ip: "localhost",
          port: 4001,
          serviceName: "ai-chat-service",
          healthStatus: "healthy",
          weight: 1,
          enabled: true,
          ephemeral: false,
          clusterName: "DEFAULT",
          metadata: {},
          lastHeartbeat: Date.now(),
        },
      ],
      "file-conversion": [
        {
          instanceId: "fallback-file-1",
          ip: "localhost",
          port: 4002,
          serviceName: "file-conversion",
          healthStatus: "healthy",
          weight: 1,
          enabled: true,
          ephemeral: false,
          clusterName: "DEFAULT",
          metadata: {},
          lastHeartbeat: Date.now(),
        },
      ],
      rustfs: [
        {
          instanceId: "fallback-rustfs-1",
          ip: "rustfs",
          port: 9000,
          serviceName: "rustfs",
          healthStatus: "healthy",
          weight: 1,
          enabled: true,
          ephemeral: false,
          clusterName: "DEFAULT",
          metadata: {},
          lastHeartbeat: Date.now(),
        },
      ],
    };

    return fallbackConfigs[serviceName] || [];
  }

  async subscribe(
    serviceName: string,
    callback: (instances: ServiceInstance[]) => void,
  ): Promise<void> {
    this.subscriptionCallbacks.set(serviceName, callback);

    if (this.isConnected) {
      try {
        await axios.post(
          `http://${this.nacosServerAddr}/nacos/v1/ns/instance/subscribe`,
          null,
          {
            params: {
              serviceName,
              namespaceId: this.nacosNamespace,
              groupName: this.nacosGroup,
            },
          },
        );
        this.logger.log(`订阅服务成功: ${serviceName}`);
      } catch (error: any) {
        this.logger.warn(`订阅服务失败 ${serviceName}: ${error.message}`);
      }
    }
  }

  async unsubscribe(serviceName: string): Promise<void> {
    this.subscriptionCallbacks.delete(serviceName);

    if (this.isConnected) {
      try {
        await axios.delete(
          `http://${this.nacosServerAddr}/nacos/v1/ns/instance/subscribe`,
          {
            params: {
              serviceName,
              namespaceId: this.nacosNamespace,
              groupName: this.nacosGroup,
            },
          },
        );
      } catch (error: any) {
        this.logger.warn(`取消订阅失败 ${serviceName}: ${error.message}`);
      }
    }
  }

  async getConfig(
    dataId: string,
    group: string = "DEFAULT_GROUP",
  ): Promise<string | null> {
    this.logger.log(`>>> [getConfig] dataId=${dataId}, isConnected=${this.isConnected}`);
    if (!this.isConnected) {
      this.logger.error("getConfig - Nacos 未连接，无法获取远程配置");
      return this.getLocalConfig(dataId);
    }

    try {
      const response = await axios.get(
        `http://${this.nacosServerAddr}/nacos/v1/cs/configs`,
        {
          params: {
            dataId,
            group,
            namespaceId: this.nacosNamespace,
          },
        },
      );

      if (typeof response.data === "string") {
        this.recordConfigHistory(dataId, response.data);
        return response.data;
      }
      return null;
    } catch (error: any) {
      const details = error.response
        ? `状态码: ${error.response.status}, URL: ${error.config?.url}`
        : error.message;
      this.logger.error(`获取 Nacos 配置失败 ${dataId}: ${details}`);
      return this.getLocalConfig(dataId);
    }
  }

  private recordConfigHistory(dataId: string, value: string): void {
    const history = this.configHistory.get(dataId) || [];
    history.push({ value, timestamp: Date.now() });

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const filteredHistory = history.filter((h) => h.timestamp > thirtyDaysAgo);
    this.configHistory.set(dataId, filteredHistory);
  }

  getConfigHistory(
    dataId: string,
  ): Array<{ value: string; timestamp: number }> {
    return this.configHistory.get(dataId) || [];
  }

  async subscribeConfig(
    dataId: string,
    group: string,
    callback: (config: string) => void,
  ): Promise<void> {
    const key = `${dataId}:${group}`;
    this.configSubscriptionCallbacks.set(key, callback);

    if (this.isConnected) {
      try {
        await axios.post(
          `http://${this.nacosServerAddr}/nacos/v1/cs/configs/listener`,
          `dataId=${dataId}&group=${group}&namespaceId=${this.nacosNamespace}&content=${encodeURIComponent("")}`,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
        );
        this.logger.log(`订阅配置成功: ${dataId}`);
      } catch (error: any) {
        this.logger.warn(`订阅配置失败 ${dataId}: ${error.message}`);
      }
    }
  }

  private getLocalConfig(dataId: string): string | null {
    const localConfigs: Record<string, string> = {
      "gateway-routes": JSON.stringify({
        routes: [
          // { id: 'auth', path: '/api/auth/*', serviceName: 'service', targetPort: 4000, priority: 10 },
          // { id: 'users', path: '/api/users/*', serviceName: 'service', targetPort: 4000, priority: 10 },
          // { id: 'projects', path: '/api/projects/*', serviceName: 'service', targetPort: 4000, priority: 10 },
          // { id: 'requirements', path: '/api/requirements/*', serviceName: 'service', targetPort: 4000, priority: 10 },
          // { id: 'tasks', path: '/api/tasks/*', serviceName: 'service', targetPort: 4000, priority: 10 },
          // { id: 'ai', path: '/api/ai/*', serviceName: 'service', targetPort: 4000, priority: 10 },
          // { id: 'conversations', path: '/api/conversations/*', serviceName: 'ai-chat-service', targetPort: 4001, priority: 10 },
          // { id: 'chat', path: '/api/chat/*', serviceName: 'ai-chat-service', targetPort: 4001, priority: 10 },
          // { id: 'convert', path: '/api/convert/*', serviceName: 'file-conversion', targetPort: 4002, priority: 10 },
          // { id: 'rustfs-upload', path: '/api/storage/upload/*', serviceName: 'rustfs', targetPort: 9000, priority: 10 },
          // { id: 'rustfs-download', path: '/api/storage/download/*', serviceName: 'rustfs', targetPort: 9000, priority: 10 },
          // { id: 'rustfs-presigned', path: '/api/storage/presigned/*', serviceName: 'rustfs', targetPort: 9000, priority: 10 },
        ],
      }),
      "gateway-loadbalancer": JSON.stringify({
        defaultStrategy: "roundRobin",
        strategies: {
          service: "weightedRoundRobin",
          "ai-chat-service": "weightedRandom",
          "file-conversion": "roundRobin",
          rustfs: "roundRobin",
        },
      }),
      "gateway-circuitbreaker": JSON.stringify({
        failureThreshold: 5,
        resetTimeout: 30000,
        halfOpenRequests: 1,
      }),
    };

    return localConfigs[dataId] || null;
  }

  async publishConfig(
    dataId: string,
    group: string,
    content: string,
  ): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn("Config 客户端未初始化，无法发布配置");
      return false;
    }

    try {
      await axios.post(
        `http://${this.nacosServerAddr}/nacos/v1/cs/configs`,
        null,
        {
          params: {
            dataId,
            group,
            namespaceId: this.nacosNamespace,
            content,
          },
        },
      );
      this.recordConfigHistory(dataId, content);
      return true;
    } catch (error: any) {
      this.logger.error(`发布配置失败 ${dataId}: ${error.message}`);
      return false;
    }
  }

  async shutdown(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    await this.deregisterGateway();
    this.isConnected = false;
    this.logger.log("Nacos 服务已关闭");
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async waitForReady(): Promise<void> {
    if (this.isConnected) return;
    this.logger.log(">>> [waitForReady] 等待 Nacos 连接...");
    await this.connectionReadyPromise;
    this.logger.log(`>>> [waitForReady] 等待完成, isConnected=${this.isConnected}`);
  }

  private getLocalIP(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
    return "127.0.0.1";
  }
}
