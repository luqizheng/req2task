import { ServiceInstance } from '../common/types';

export interface LoadBalancerStrategy {
  select(instances: ServiceInstance[]): ServiceInstance | null;
  readonly name: string;
}
