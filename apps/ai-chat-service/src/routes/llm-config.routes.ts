import { Router, Request, Response } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LlMConfigService } from '../services/llm-config.service.js';
import { logger } from '../utils/logger.js';
import {
  CreateLlmConfigDto,
  UpdateLlmConfigDto,
  LlmConfigListResponseDto,
  LlmConfigDetailResponseDto,
} from '@req2task/dto';

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
  success?: boolean;
}

async function validateDto<T extends object>(dtoClass: new () => T, body: unknown): Promise<T | null> {
  const dto = plainToInstance(dtoClass, body);
  const errors = await validate(dto as object);
  if (errors.length > 0) {
    return null;
  }
  return dto;
}

export function createLlMConfigRoutes(llmConfigService: LlMConfigService): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    try {
      const dto = await validateDto(CreateLlmConfigDto, req.body);
      if (!dto) {
        return res.status(400).json({ code: 1, message: 'Validation failed',success: false } as ApiResponse<null>);
      }

      const config = await llmConfigService.create(dto);
      logger.info({ configId: config.id }, 'LLM config created');
      return res.status(201).json({ code: 0, data: config,success: true } as ApiResponse<CreateLlmConfigDto>);
    } catch (error) {
      logger.error({ error }, 'Create LLM config error');
      return res.status(500).json({ code: 1, message: 'Failed to create LLM config',success: false } as ApiResponse<null>);
    }
  });

  router.get('/', async (req: Request, res: Response) => {
    try {
      const result = await llmConfigService.findAll();
      return res.json({ code: 0, data: result,success: true } as ApiResponse<LlmConfigListResponseDto>);
    } catch (error) {
      logger.error({ error }, 'List LLM configs error');
      return res.status(500).json({ code: 1, message: 'Failed to list LLM configs',success: false } as ApiResponse<null>);
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const config = await llmConfigService.findOne(req.params['id']!);
      if (!config) {
        return res.status(404).json({ code: 1, message: 'LLM config not found',success: false } as ApiResponse<null>);
      }
      return res.json({ code: 0, data: config,success: true } as ApiResponse<LlmConfigDetailResponseDto>);
    } catch (error) {
      logger.error({ error }, 'Get LLM config error');
      return res.status(500).json({ code: 1, message: 'Failed to get LLM config' } as ApiResponse<null>);
    }
  });

  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const dto = await validateDto(UpdateLlmConfigDto, req.body);
      if (!dto) {
        return res.status(400).json({ code: 1, message: 'Validation failed',success: false } as ApiResponse<null>);
      }

      const config = await llmConfigService.update(req.params['id']!, dto);
      if (!config) {
        return res.status(404).json({ code: 1, message: 'LLM config not found' } as ApiResponse<null>);
      }
      logger.info({ configId: req.params['id']!, success: true }, 'LLM config updated');
      return res.json({ code: 0, data: config,success: true } as ApiResponse<LlmConfigDetailResponseDto>);
    } catch (error) {
      logger.error({ error }, 'Update LLM config error');
      return res.status(500).json({ code: 1, message: 'Failed to update LLM config',success: false } as ApiResponse<null>); 
    }
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const deleted = await llmConfigService.remove(req.params['id']!);
      if (!deleted) {
        return res.status(404).json({ code: 1, message: 'LLM config not found',success: false } as ApiResponse<null>);
      }
      logger.info({ configId: req.params['id']!, success: true }, 'LLM config deleted');
      return res.status(204).send();
    } catch (error) {
      logger.error({ error }, 'Delete LLM config error');
      return res.status(500).json({ code: 1, message: 'Failed to delete LLM config',success: false } as ApiResponse<null>); 
    }
  });

  router.post('/:id/test', async (req: Request, res: Response) => {
    try {
      const result = await llmConfigService.testConnection(req.params['id']!);
      logger.info({ configId: req.params['id']!, success: result.success }, 'LLM config test completed');
      return res.json({
        code: result.success ? 0 : 1,
        data: result,
        message: result.message,
        success: result.success,
        successMessage: result.success ? 'success' : 'failed',
      } as ApiResponse<{ success: boolean; message: string }>);
    } catch (error) {
      logger.error({ error }, 'Test LLM config error');
      return res.status(500).json({ code: 1, message: 'Failed to test LLM config' } as ApiResponse<null>);
    }
  });

  return router;
}
