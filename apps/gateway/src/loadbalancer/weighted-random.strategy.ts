import { Injectable } from '@nestjs/common';
import { LoadBalancerStrategy } from './loadbalancer.interface';
import { ServiceInstance } from '../common/types';

@Injectable()
export class WeightedRandomStrategy implements LoadBalancerStrategy {
  readonly name = 'weightedRandom';

  select(instances: ServiceInstance[]): ServiceInstance | null {
    if (instances.length === 0) return null;

    const healthyInstances = instances.filter(
      (i) => i.healthStatus === 'healthy' && i.enabled
    );

    if (healthyInstances.length === 0) return null;

    const weightedList: ServiceInstance[] = [];
    healthyInstances.forEach((instance) => {
      const weight = instance.weight || 1;
      for (let i = 0; i < weight; i++) {
        weightedList.push(instance);
      }
    });

    const randomIndex = Math.floor(Math.random() * weightedList.length);
    return weightedList[randomIndex];
  }
}
