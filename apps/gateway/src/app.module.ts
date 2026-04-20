import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NacosModule } from './nacos/nacos.module';
import { LoadBalancerModule } from './loadbalancer/loadbalancer.module';
import { RouterModule } from './router/router.module';
import { ProxyModule } from './proxy/proxy.module';
import { CircuitBreakerModule } from './circuit-breaker/circuit-breaker.module';
import { HealthModule } from './health/health.module';
import { TracingModule } from './tracing/tracing.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    NacosModule,
    LoadBalancerModule,
    RouterModule,
    ProxyModule,
    CircuitBreakerModule,
    HealthModule,
    TracingModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
