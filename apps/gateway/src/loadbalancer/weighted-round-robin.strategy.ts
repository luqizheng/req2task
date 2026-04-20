import { Injectable } from '@nestjs/common';
import { LoadBalancerStrategy } from './loadbalancer.interface';
import { ServiceInstance } from '../common/types';

@Injectable()
export class WeightedRoundRobinStrategy implements LoadBalancerStrategy {
  readonly name = 'weightedRoundRobin';
  private currentIndex = 0;
  private currentWeight = 0;
  private weights: Map<string, number> = new Map();

  select(instances: ServiceInstance[]): ServiceInstance | null {
    if (instances.length === 0) return null;

    const healthyInstances = instances.filter(
      (i) => i.healthStatus === 'healthy' && i.enabled
    );

    if (healthyInstances.length === 0) return null;

    let totalWeight = 0;
    healthyInstances.forEach((instance) => {
      const weight = instance.weight || 1;
      totalWeight += weight;
      this.weights.set(instance.instanceId, weight);
    });

    if (totalWeight === 0) return healthyInstances[0];

    let selectedInstance: ServiceInstance | null = null;
    let maxWeight = 0;

    for (let i = 0; i < healthyInstances.length; i++) {
      const index = (this.currentIndex + i) % healthyInstances.length;
      const instance = healthyInstances[index];
      const weight = instance.weight || 1;

      if (weight > maxWeight) {
        maxWeight = weight;
        selectedInstance = instance;
        this.currentIndex = (index + 1) % healthyInstances.length;
      }
    }

    this.currentWeight = (this.currentWeight + 1) % totalWeight;
    return selectedInstance || healthyInstances[0];
  }
}
