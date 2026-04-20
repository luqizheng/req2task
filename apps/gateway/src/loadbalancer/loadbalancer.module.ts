import { Module } from '@nestjs/common';
import { LoadBalancerService } from './loadbalancer.service';
import { WeightedRoundRobinStrategy } from './weighted-round-robin.strategy';
import { WeightedRandomStrategy } from './weighted-random.strategy';

@Module({
  providers: [LoadBalancerService, WeightedRoundRobinStrategy, WeightedRandomStrategy],
  exports: [LoadBalancerService],
})
export class LoadBalancerModule {}
