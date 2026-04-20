import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TracingService, TracingMiddleware } from './tracing.service';

@Module({
  providers: [TracingService],
  exports: [TracingService],
})
export class TracingModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TracingMiddleware).forRoutes('*');
  }
}
