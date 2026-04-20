import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createConversationRoutes } from './routes/conversation.routes.js';
import { ConversationService } from './services/conversation.service.js';
import { LLMService } from './services/llm.service.js';
import { initializeDatabase, dataSource } from './database/index.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

export async function createApp(): Promise<Express> {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  await initializeDatabase();
  logger.info('Database initialized');

  const conversationService = new ConversationService(dataSource);
  const llmService = new LLMService(config.llm.apiKey, config.llm.defaultModel);

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      openaiConfigured: !!config.llm.apiKey,
      databaseConnected: dataSource.isInitialized,
    });
  });

  app.use('/api/ai/conversations', createConversationRoutes(conversationService, llmService));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ error: err }, 'Unhandled error');
    res.status(500).json({
      code: 1,
      message: 'Internal server error',
    });
  });

  return app;
}
