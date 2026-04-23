import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Logger } from './common/utils/logger';
import { RouterService } from './router/router.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const routerService = app.get(RouterService);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:5173'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });

  const port = configService.get('PORT', 8080);
  await app.listen(port);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  logger.log(`API Gateway 已启动在端口 ${port}`);
  logger.log(`环境：${configService.get('NODE_ENV', 'development')}`);
  
  const routes = routerService.getAllRoutes();
  if (routes.length > 0) {
    logger.log('═'.repeat(60));
    logger.log('路由规则表:');
    logger.log('─'.repeat(60));
    routes.forEach((route, index) => {
      const methods = route.methods.join(',');
      logger.log(`  ${String(index + 1).padStart(2)} | ${route.pathPattern.padEnd(25)} | ${methods.padEnd(10)} | ${route.targetService}:${route.targetPort}`);
    });
    logger.log('═'.repeat(60));
    logger.log(`共 ${routes.length} 条路由规则`);
  }
}

bootstrap();
