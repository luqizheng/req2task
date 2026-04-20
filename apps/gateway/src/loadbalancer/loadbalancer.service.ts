import { Injectable, OnModuleInit } from '@nestjs/common';
import { NacosService } from '../nacos/nacos.service';
import { Logger } from '../common/utils/logger';
import { ServiceInstance } from '../common/types';
import { LoadBalancerStrategy } from './loadbalancer.interface';
import { WeightedRoundRobinStrategy } from './weighted-round-robin.strategy';
import { WeightedRandomStrategy } from './weighted-random.strategy';

@Injectable()
export class LoadBalancerService implements OnModuleInit {
  private readonly logger = new Logger('LoadBalancer');
  private strategies: Map<string, LoadBalancerStrategy> = new Map();
  private serviceStrategyMap: Map<string, string> = new Map();
  private defaultStrategy = 'roundRobin';

  constructor(
    private readonly nacosService: NacosService,
    private readonly roundRobin: WeightedRoundRobinStrategy,
    private readonly weightedRandom: WeightedRandomStrategy,
  ) {}

  async onModuleInit() {
    this.strategies.set('roundRobin', this.roundRobin);
    this.strategies.set('weightedRoundRobin', this.roundRobin);
    this.strategies.set('weightedRandom', this.weightedRandom);

    await this.loadStrategyConfig();
  }

  private async loadStrategyConfig() {
    try {
      const configStr = await this.nacosService.getConfig('gateway-loadbalancer');
      if (configStr) {
        const config = JSON.parse(configStr);
        if (config.defaultStrategy) {
          this.defaultStrategy = config.defaultStrategy;
        }
        if (config.strategies) {
          Object.entries(config.strategies).forEach(([service, strategy]) => {
            this.serviceStrategyMap.set(service, strategy as string);
          });
        }
        this.logger.log('负载均衡策略配置加载成功');
      }
    } catch (error) {
      this.logger.warn(`加载负载均衡策略配置失败: ${error.message}，使用默认策略`);
    }
  }

  async selectInstance(serviceName: string): Promise<ServiceInstance | null> {
    const instances = await this.nacosService.selectInstances(serviceName, true);
    
    if (instances.length === 0) {
      this.logger.warn(`服务 ${serviceName} 没有可用实例`);
      return null;
    }

    const strategyName = this.serviceStrategyMap.get(serviceName) || this.defaultStrategy;
    const strategy = this.strategies.get(strategyName);

    if (!strategy) {
      this.logger.warn(`未找到策略 ${strategyName}，使用默认策略`);
      return instances[0];
    }

    const selected = strategy.select(instances);
    if (selected) {
      this.logger.debug(`服务 ${serviceName} 选择实例 ${selected.ip}:${selected.port}`);
    }
    return selected;
  }

  setStrategy(serviceName: string, strategyName: string): void {
    if (this.strategies.has(strategyName)) {
      this.serviceStrategyMap.set(serviceName, strategyName);
      this.logger.log(`服务 ${serviceName} 策略已切换为 ${strategyName}`);
    } else {
      this.logger.warn(`策略 ${strategyName} 不存在`);
    }
  }

  getStrategy(serviceName: string): string {
    return this.serviceStrategyMap.get(serviceName) || this.defaultStrategy;
  }

  registerStrategy(name: string, strategy: LoadBalancerStrategy): void {
    this.strategies.set(name, strategy);
    this.logger.log(`注册负载均衡策略: ${name}`);
  }
}
