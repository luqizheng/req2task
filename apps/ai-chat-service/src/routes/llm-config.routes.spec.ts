import express, { Express } from 'express';
import request from 'supertest';
import { createLlMConfigRoutes } from './llm-config.routes.js';
import { LlMConfigService } from '../services/llm-config.service.js';

jest.mock('../services/llm-config.service.js');

describe('LLM Config Routes', () => {
  let app: Express;
  let mockService: jest.Mocked<LlMConfigService>;

  const mockConfig = {
    id: 'config-1',
    name: 'Test Config',
    provider: 'deepseek' as const,
    modelName: 'deepseek-chat',
    baseUrl: null,
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    isDefault: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      testConnection: jest.fn(),
    } as unknown as jest.Mocked<LlMConfigService>;

    app = express();
    app.use(express.json());
    app.use('/api/llm-configs', createLlMConfigRoutes(mockService));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create config', async () => {
      mockService.create.mockResolvedValue({ ...mockConfig, apiKey: '[ENCRYPTED]' });

      const response = await request(app)
        .post('/api/llm-configs')
        .send({ name: 'Test', provider: 'deepseek', modelName: 'deepseek-chat' });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe(0);
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/llm-configs')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.code).toBe(1);
    });
  });

  describe('GET /', () => {
    it('should return config list', async () => {
      mockService.findAll.mockResolvedValue({
        configs: [mockConfig],
        total: 1,
      });

      const response = await request(app).get('/api/llm-configs');

      expect(response.status).toBe(200);
      expect(response.body.data.configs).toHaveLength(1);
    });
  });

  describe('GET /:id', () => {
    it('should return config by id', async () => {
      mockService.findOne.mockResolvedValue({ ...mockConfig, apiKey: '[ENCRYPTED]' });

      const response = await request(app).get('/api/llm-configs/config-1');

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('config-1');
    });

    it('should return 404 when config not found', async () => {
      mockService.findOne.mockResolvedValue(null);

      const response = await request(app).get('/api/llm-configs/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /:id', () => {
    it('should update config', async () => {
      mockService.update.mockResolvedValue({ ...mockConfig, name: 'Updated' });

      const response = await request(app)
        .put('/api/llm-configs/config-1')
        .send({ name: 'Updated' });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated');
    });

    it('should return 404 when config not found', async () => {
      mockService.update.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/llm-configs/nonexistent')
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /:id', () => {
    it('should delete config', async () => {
      mockService.remove.mockResolvedValue(true);

      const response = await request(app).delete('/api/llm-configs/config-1');

      expect(response.status).toBe(204);
    });

    it('should return 404 when config not found', async () => {
      mockService.remove.mockResolvedValue(false);

      const response = await request(app).delete('/api/llm-configs/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /:id/test', () => {
    it('should test config connection successfully', async () => {
      mockService.testConnection.mockResolvedValue({
        success: true,
        message: 'Connection successful',
      });

      const response = await request(app).post('/api/llm-configs/config-1/test');

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(0);
      expect(response.body.data.success).toBe(true);
    });

    it('should return error when test fails', async () => {
      mockService.testConnection.mockResolvedValue({
        success: false,
        message: 'Connection failed',
      });

      const response = await request(app).post('/api/llm-configs/config-1/test');

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(1);
      expect(response.body.data.success).toBe(false);
    });
  });
});
