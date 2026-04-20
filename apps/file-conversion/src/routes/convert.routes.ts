import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ConversionService } from '../services/conversion.service.js';
import {
  SyncConvertRequest,
  AsyncConvertRequest,
  SUPPORTED_MIME_TYPES,
} from '../types.js';

const syncSchema = z.object({
  file: z.string(),
  mimeType: z.string(),
  originalName: z.string(),
});

const asyncSchema = z.object({
  file: z.string(),
  mimeType: z.string(),
  originalName: z.string().optional(),
  callbackUrl: z.string().url().optional(),
});

export function createConvertRoutes(conversionService: ConversionService): Router {
  const router = Router();

  router.post('/sync', async (req: Request, res: Response) => {
    try {
      const validation = syncSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: `Invalid request: ${validation.error.message}`,
        });
      }

      const { file, mimeType, originalName } = validation.data;

      if (!conversionService.isSupported(mimeType)) {
        return res.status(400).json({
          success: false,
          error: `Unsupported file type: ${mimeType}. Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`,
        });
      }

      const buffer = Buffer.from(file, 'base64');
      const result = await conversionService.convert(buffer, mimeType, originalName);

      if (!result.success) {
        return res.status(422).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Sync conversion error:', error);
      return res.status(500).json({
        success: false,
        error: `Internal error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  });

  router.post('/async', async (req: Request, res: Response) => {
    try {
      const validation = asyncSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: `Invalid request: ${validation.error.message}`,
        });
      }

      const { file, mimeType, originalName, callbackUrl } = validation.data;

      if (!conversionService.isSupported(mimeType)) {
        return res.status(400).json({
          success: false,
          error: `Unsupported file type: ${mimeType}`,
        });
      }

      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      setImmediate(async () => {
        try {
          const buffer = Buffer.from(file, 'base64');
          const result = await conversionService.convert(
            buffer,
            mimeType,
            originalName || 'unknown'
          );

          if (callbackUrl) {
            await fetch(callbackUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobId, ...result }),
            });
          }
        } catch (error) {
          console.error(`Async job ${jobId} failed:`, error);
        }
      });

      return res.json({
        jobId,
        status: 'queued',
        message: 'Job queued for processing',
      });
    } catch (error) {
      console.error('Async conversion error:', error);
      return res.status(500).json({
        success: false,
        error: `Internal error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  });

  router.get('/supported-types', (_req: Request, res: Response) => {
    return res.json({
      types: conversionService.getSupportedTypes(),
    });
  });

  return router;
}
