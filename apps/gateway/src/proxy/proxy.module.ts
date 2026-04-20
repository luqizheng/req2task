import { Module } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { ProxyController } from './proxy.controller';
import { RouterModule } from '../router/router.module';
import { LoadBalancerModule } from '../loadbalancer/loadbalancer.module';
import { CircuitBreakerModule } from '../circuit-breaker/circuit-breaker.module';
import { TracingModule } from '../tracing/tracing.module';

@Module({
  imports: [RouterModule, LoadBalancerModule, CircuitBreakerModule, TracingModule],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
