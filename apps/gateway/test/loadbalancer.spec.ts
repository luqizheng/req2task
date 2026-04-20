import { Test, TestingModule } from '@nestjs/testing';
import { LoadBalancerService } from '../src/loadbalancer/loadbalancer.service';
import { WeightedRoundRobinStrategy } from '../src/loadbalancer/weighted-round-robin.strategy';
import { WeightedRandomStrategy } from '../src/loadbalancer/weighted-random.strategy';
import { NacosService } from '../src/nacos/nacos.service';
import { ServiceInstance } from '../src/common/types';

describe('LoadBalancerService', () => {
  let service: LoadBalancerService;
  let nacosService: NacosService;

  const mockInstances: ServiceInstance[] = [
    {
      instanceId: 'inst1',
      ip: '192.168.1.1',
      port: 4000,
      serviceName: 'test-service',
      healthStatus: 'healthy',
      weight: 2,
      enabled: true,
      ephemeral: false,
      clusterName: 'DEFAULT',
      metadata: {},
      lastHeartbeat: Date.now(),
    },
    {
      instanceId: 'inst2',
      ip: '192.168.1.2',
      port: 4000,
      serviceName: 'test-service',
      healthStatus: 'healthy',
      weight: 1,
      enabled: true,
      ephemeral: false,
      clusterName: 'DEFAULT',
      metadata: {},
      lastHeartbeat: Date.now(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoadBalancerService,
        WeightedRoundRobinStrategy,
        WeightedRandomStrategy,
        {
          provide: NacosService,
          useValue: {
            selectInstances: jest.fn().mockResolvedValue(mockInstances),
          },
        },
      ],
    }).compile();

    service = module.get<LoadBalancerService>(LoadBalancerService);
    nacosService = module.get<NacosService>(NacosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('selectInstance', () => {
    it('should select an instance', async () => {
      const instance = await service.selectInstance('test-service');
      expect(instance).toBeDefined();
      expect(instance).toHaveProperty('ip');
      expect(instance).toHaveProperty('port');
    });

    it('should return null when no instances available', async () => {
      jest.spyOn(nacosService, 'selectInstances').mockResolvedValueOnce([]);
      const instance = await service.selectInstance('nonexistent');
      expect(instance).toBeNull();
    });
  });

  describe('strategy selection', () => {
    it('should set strategy for service', () => {
      service.setStrategy('test-service', 'weightedRandom');
      const strategy = service.getStrategy('test-service');
      expect(strategy).toBe('weightedRandom');
    });
  });
});

describe('WeightedRoundRobinStrategy', () => {
  let strategy: WeightedRoundRobinStrategy;

  const healthyInstances: ServiceInstance[] = [
    {
      instanceId: 'inst1',
      ip: '192.168.1.1',
      port: 4000,
      serviceName: 'test',
      healthStatus: 'healthy',
      weight: 2,
      enabled: true,
      ephemeral: false,
      clusterName: 'DEFAULT',
      metadata: {},
      lastHeartbeat: Date.now(),
    },
    {
      instanceId: 'inst2',
      ip: '192.168.1.2',
      port: 4000,
      serviceName: 'test',
      healthStatus: 'healthy',
      weight: 1,
      enabled: true,
      ephemeral: false,
      clusterName: 'DEFAULT',
      metadata: {},
      lastHeartbeat: Date.now(),
    },
  ];

  beforeEach(() => {
    strategy = new WeightedRoundRobinStrategy();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should select an instance', () => {
    const selected = strategy.select(healthyInstances);
    expect(selected).toBeDefined();
    expect(selected?.instanceId).toBeDefined();
  });

  it('should return null for empty instances', () => {
    const selected = strategy.select([]);
    expect(selected).toBeNull();
  });

  it('should skip unhealthy instances', () => {
    const unhealthyInstances = healthyInstances.map((i) => ({
      ...i,
      healthStatus: 'unhealthy' as const,
    }));
    const selected = strategy.select(unhealthyInstances);
    expect(selected).toBeNull();
  });
});
