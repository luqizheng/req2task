import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createConvertRoutes } from './routes/convert.routes.js';
import { ConversionService } from './services/conversion.service.js';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '100mb' }));

  const openAiApiKey = process.env.OPENAI_API_KEY || '';
  const whisperModel = process.env.WHISPER_MODEL || 'whisper-1';
  const aiChatServiceUrl = process.env.AI_CHAT_SERVICE_URL || 'http://localhost:4001';
  const conversionService = new ConversionService(openAiApiKey, whisperModel, aiChatServiceUrl);

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/convert', createConvertRoutes(conversionService));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  });

  return app;
}
