import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NacosService } from '../nacos/nacos.service';
import { Logger } from '../common/utils/logger';
import { RouteMatcher } from './route-matcher';
import { RouteRule, RouteMatchResult } from './router.types';

@Injectable()
export class RouterService implements OnApplicationBootstrap {
  private readonly logger = new Logger('RouterService');
  private routes: RouteRule[] = [];
  private routeMap: Map<string, RouteRule[]> = new Map();

  constructor(
    private readonly nacosService: NacosService,
    private readonly routeMatcher: RouteMatcher,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.loadRoutes();
    await this.subscribeRouteChanges();
  }

  private async loadRoutes() {
    try {
      await this.nacosService.waitForReady();
      const configStr = await this.nacosService.getConfig('gateway-routes');
      if (configStr) {
        const config = JSON.parse(configStr);
        if (config.routes) {
          this.routes = config.routes.map((r: any) => this.normalizeRoute(r));
          this.buildRouteIndex();
          this.logger.log(`加载了 ${this.routes.length} 条路由规则`);
        }
      } else {
        this.loadDefaultRoutes();
      }
    } catch (error) {
      this.logger.error(`加载路由配置失败: ${error?.message || error}`);
      this.loadDefaultRoutes();
    }
  }

  private loadDefaultRoutes() {
    this.routes = [
      // { id: 'auth', name: 'Auth Service', priority: 10, serviceName: 'service', pathPattern: '/api/auth/*', methods: ['ALL'], targetService: 'service', targetPort: 4000, isRegex: false },
      // { id: 'users', name: 'Users Service', priority: 10, serviceName: 'service', pathPattern: '/api/users/*', methods: ['ALL'], targetService: 'service', targetPort: 4000, isRegex: false },
      // { id: 'projects', name: 'Projects Service', priority: 10, serviceName: 'service', pathPattern: '/api/projects/*', methods: ['ALL'], targetService: 'service', targetPort: 4000, isRegex: false },
      // { id: 'requirements', name: 'Requirements Service', priority: 10, serviceName: 'service', pathPattern: '/api/requirements/*', methods: ['ALL'], targetService: 'service', targetPort: 4000, isRegex: false },
      // { id: 'tasks', name: 'Tasks Service', priority: 10, serviceName: 'service', pathPattern: '/api/tasks/*', methods: ['ALL'], targetService: 'service', targetPort: 4000, isRegex: false },
      // { id: 'ai', name: 'AI Service', priority: 10, serviceName: 'service', pathPattern: '/api/ai/*', methods: ['ALL'], targetService: 'service', targetPort: 4000, isRegex: false, pathRewrite: { pattern: '^/api/ai', replacement: '' } },
      // { id: 'conversations', name: 'Conversations Service', priority: 10, serviceName: 'ai-chat-service', pathPattern: '/api/conversations/*', methods: ['ALL'], targetService: 'ai-chat-service', targetPort: 4001, isRegex: false },
      // { id: 'chat', name: 'Chat Service', priority: 10, serviceName: 'ai-chat-service', pathPattern: '/api/chat/*', methods: ['ALL'], targetService: 'ai-chat-service', targetPort: 4001, isRegex: false },
      // { id: 'convert', name: 'File Conversion Service', priority: 10, serviceName: 'file-conversion', pathPattern: '/api/convert/*', methods: ['ALL'], targetService: 'file-conversion', targetPort: 4002, isRegex: false },
      // { id: 'health', name: 'Health Check', priority: 100, serviceName: 'gateway', pathPattern: '/api/health/*', methods: ['ALL'], targetService: 'gateway', targetPort: 3000, isRegex: false },
    ];
    this.buildRouteIndex();
    this.logger.log('加载默认路由规则');
  }

  private normalizeRoute(route: any): RouteRule {
    return {
      id: route.id || route.pathPattern,
      name: route.name || route.id,
      priority: route.priority || 10,
      serviceName: route.serviceName || route.targetService,
      pathPattern: route.pathPattern || route.path,
      methods: route.methods || ['ALL'],
      targetService: route.targetService || route.serviceName,
      targetPort: route.targetPort || route.port,
      isRegex: route.isRegex || false,
      pathRewrite: route.pathRewrite,
      headers: route.headers,
      timeout: route.timeout || 30000,
      retryAttempts: route.retryAttempts || 0,
      loadBalancer: route.loadBalancer,
      metadata: route.metadata,
    };
  }

  private buildRouteIndex() {
    this.routeMap.clear();
    this.routes.forEach((route) => {
      const prefix = route.pathPattern.split('*')[0].replace(/\/+$/, '') || '/';
      const existing = this.routeMap.get(prefix) || [];
      existing.push(route);
      this.routeMap.set(prefix, existing);
    });

    this.routes.sort((a, b) => b.priority - a.priority);
  }

  private async subscribeRouteChanges() {
    try {
      await this.nacosService.subscribeConfig('gateway-routes', 'DEFAULT_GROUP', async (config) => {
        this.logger.log('检测到路由配置变更');
        await this.updateRoutes(config);
      });
    } catch (error) {
      this.logger.warn(`订阅路由配置变更失败: ${error.message}`);
    }
  }

  private async updateRoutes(config: string) {
    try {
      const newConfig = JSON.parse(config);
      if (newConfig.routes) {
        const newRoutes = newConfig.routes.map((r: any) => this.normalizeRoute(r));
        
        const conflict = this.detectConflicts(newRoutes);
        if (conflict) {
          this.logger.warn(`路由配置存在冲突: ${conflict}`);
          return;
        }

        this.routes = newRoutes;
        this.buildRouteIndex();
        this.logger.log(`路由规则已更新，共 ${this.routes.length} 条`);
      }
    } catch (error) {
      this.logger.error(`更新路由配置失败: ${error.message}`);
    }
  }

  private detectConflicts(routes: RouteRule[]): string | null {
    for (let i = 0; i < routes.length; i++) {
      for (let j = i + 1; j < routes.length; j++) {
        if (this.pathsOverlap(routes[i].pathPattern, routes[j].pathPattern)) {
          return `${routes[i].id} 与 ${routes[j].id}`;
        }
      }
    }
    return null;
  }

  private pathsOverlap(pattern1: string, pattern2: string): boolean {
    const regex1 = new RegExp('^' + pattern1.replace(/\*/g, '.*').replace(/\//g, '\\/') + '$');
    const regex2 = new RegExp('^' + pattern2.replace(/\*/g, '.*').replace(/\//g, '\\/') + '$');
    return regex1.test(regex2.source) || regex2.test(regex1.source.replace(/\\/g, ''));
  }

  findRoute(path: string, method: string): RouteMatchResult {
    for (const route of this.routes) {
      const result = this.routeMatcher.match(route, path, method);
      if (result.matched) {
        return result;
      }
    }
    return { matched: false };
  }

  getAllRoutes(): RouteRule[] {
    return [...this.routes];
  }

  getRouteById(id: string): RouteRule | undefined {
    return this.routes.find((r) => r.id === id);
  }
}
