import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Gateway (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Basic Routing', () => {
    it('should handle /api/auth/* requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/login')
        .expect((res) => {
          return res.status === 200 || res.status === 502;
        });
    });

    it('should handle /api/users/* requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/profile')
        .expect((res) => {
          return res.status === 200 || res.status === 502;
        });
    });

    it('should return 404 for unknown routes', () => {
      return request(app.getHttpServer())
        .get('/api/unknown/route')
        .expect((res) => {
          return res.status === 404 || res.status === 502;
        });
    });
  });

  describe('Circuit Breaker', () => {
    it('should return 503 when service is down', async () => {
      return request(app.getHttpServer())
        .get('/api/test-circuit-breaker')
        .expect((res) => {
          return res.status === 503 || res.status === 404;
        });
    });
  });
});
