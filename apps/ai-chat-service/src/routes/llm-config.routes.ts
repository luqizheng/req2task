import { Router, Request, Response } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LLMConfigService } from '../services/llm-config.service.js';
import { LLMService } from '../services/llm.service.js';
import {
  CreateLLMConfigDto,
  UpdateLLMConfigDto,
  LLMConfigResponseDto,
  TestLLMConfigDto,
} from '@req2task/dto';
import { logger } from '../utils/logger.js';

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

async function validateDto<T extends object>(dtoClass: new () => T, body: unknown): Promise<T | null> {
  const dto = plainToInstance(dtoClass, body);
  const errors = await validate(dto as object);
  if (errors.length > 0) {
    return null;
  }
  return dto;
}

export function createLLMConfigRoutes(
  llmConfigService: LLMConfigService,
  llmService: LLMService
): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    try {
      const dto = await validateDto(CreateLLMConfigDto, req.body);
      if (!dto) {
        return res.status(400).json({ code: 1, message: 'Validation failed' } as ApiResponse<null>);
      }

      const config = await llmConfigService.create(dto);
      logger.info({ configId: config.id }, 'LLM Config created');
      return res.status(201).json({ code: 0, data: config } as ApiResponse<unknown>);
    } catch (error) {
      logger.error({ error }, 'Create LLM Config error');
      return res.status(500).json({ code: 1, message: 'Failed to create LLM Config' } as ApiResponse<null>);
    }
  });

  router.get('/', async (_req: Request, res: Response) => {
    try {
      const configs = await llmConfigService.findAll();
      return res.json({ code: 0, data: configs } as ApiResponse<unknown>);
    } catch (error) {
      logger.error({ error }, 'List LLM Configs error');
      return res.status(500).json({ code: 1, message: 'Failed to list LLM Configs' } as ApiResponse<null>);
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const config = await llmConfigService.findById(req.params['id']!);
      if (!config) {
        return res.status(404).json({ code: 1, message: 'LLM Config not found' } as ApiResponse<null>);
      }
      return res.json({ code: 0, data: config } as ApiResponse<unknown>);
    } catch (error) {
      logger.error({ error }, 'Get LLM Config error');
      return res.status(500).json({ code: 1, message: 'Failed to get LLM Config' } as ApiResponse<null>);
    }
  });

  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const dto = await validateDto(UpdateLLMConfigDto, req.body);
      if (!dto) {
        return res.status(400).json({ code: 1, message: 'Validation failed' } as ApiResponse<null>);
      }

      const config = await llmConfigService.update(req.params['id']!, dto);
      if (!config) {
        return res.status(404).json({ code: 1, message: 'LLM Config not found' } as ApiResponse<null>);
      }
      logger.info({ configId: config.id }, 'LLM Config updated');
      return res.json({ code: 0, data: config } as ApiResponse<unknown>);
    } catch (error) {
      logger.error({ error }, 'Update LLM Config error');
      return res.status(500).json({ code: 1, message: 'Failed to update LLM Config' } as ApiResponse<null>);
    }
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const deleted = await llmConfigService.delete(req.params['id']!);
      if (!deleted) {
        return res.status(404).json({ code: 1, message: 'LLM Config not found' } as ApiResponse<null>);
      }
      logger.info({ configId: req.params['id'] }, 'LLM Config deleted');
      return res.status(204).send();
    } catch (error) {
      logger.error({ error }, 'Delete LLM Config error');
      return res.status(500).json({ code: 1, message: 'Failed to delete LLM Config' } as ApiResponse<null>);
    }
  });

  router.post('/:id/test', async (req: Request, res: Response) => {
    try {
      const config = await llmConfigService.findByIdWithKey(req.params['id']!);
      if (!config) {
        return res.status(404).json({ code: 1, message: 'LLM Config not found' } as ApiResponse<null>);
      }

      const testMessage = req.body.testMessage || '你好，请回复"测试成功"';

      const startTime = Date.now();
      const response = await llmService.completeWithConfig(
        [{ role: 'user', content: testMessage, id: '', createdAt: new Date() }],
        {
          provider: config.provider,
          modelName: config.modelName,
          baseUrl: config.baseUrl || undefined,
          apiKey: config.apiKey,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
          topP: config.topP,
        }
      );

      const latencyMs = Date.now() - startTime;

      return res.json({
        code: 0,
        data: {
          success: true,
          content: response.content,
          configId: config.id,
          latencyMs,
        },
      } as ApiResponse<unknown>);
    } catch (error) {
      logger.error({ error }, 'Test LLM Config error');
      return res.json({
        code: 0,
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          configId: req.params['id'],
        },
      } as ApiResponse<unknown>);
    }
  });

  return router;
}
