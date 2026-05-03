import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createConversationRoutes } from './routes/conversation.routes.js';
import { createTextRoutes } from './routes/text.routes.js';
import { createLlMConfigRoutes } from './routes/llm-config.routes.js';
import { createLlmRoutes } from './routes/llm.routes.js';
import { ConversationService } from './services/conversation.service.js';
import { LlMConfigService } from './services/llm-config.service.js';
import { LLMService } from './services/llm.service.js';
import { ServiceApiService } from './services/service-api.service.js';
import { initializeDatabase, dataSource } from './database/index.js';
import { logger } from './utils/logger.js';

export async function createApp(): Promise<Express> {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  await initializeDatabase();
  logger.info('Database initialized');

  const conversationService = new ConversationService(dataSource);
  const serviceApiService = new ServiceApiService(dataSource);

  await serviceApiService.syncFromRemote();

  const defaultLLMConfig = await serviceApiService.getDefaultLLMConfig();

  const llmService = new LLMService(defaultLLMConfig?.modelName || 'gpt-4o-mini');

  const llmConfigService = new LlMConfigService(dataSource);
  const useMockProvider = !defaultLLMConfig || !defaultLLMConfig.apiKey;

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      llmConfigured: !useMockProvider,
      llmMockMode: useMockProvider,
      databaseConnected: dataSource.isInitialized,
    });
  });

  app.use('/api/ai/conversations', createConversationRoutes(conversationService, llmService, serviceApiService));
  app.use('/api/ai/text', createTextRoutes(llmService));
  app.use('/api/ai', createLlmRoutes(llmService));
  app.use('/api/ai/llm-configs', createLlMConfigRoutes(llmConfigService));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ error: err }, 'Unhandled error');
    res.status(500).json({
      code: 1,
      message: 'Internal server error',
    });
  });

  return app;
}
