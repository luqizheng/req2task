import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as os from 'os';
import * as nacos from 'nacos';
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

const getIP = (): string => {
  const nets = os.networkInterfaces();
  let serverIp = '';
  for (const name of Object.keys(nets)) {
    const interfaces = nets[name];
    if (!interfaces) continue;
    for (const net of interfaces) {
      if (net.family === 'IPv4' && !net.internal) {
        serverIp = net.address;
        break;
      }
    }
    if (serverIp) break;
  }
  return serverIp;
};

const nacosConfig = {
  serverList: [`${process.env.NACOS_HOST || 'localhost'}:${process.env.NACOS_PORT || '8848'}`],
  namespace: process.env.NACOS_NAMESPACE || 'public',
  username: process.env.NACOS_USERNAME || 'nacos',
  password: process.env.NACOS_PASSWORD || 'nacos',
  logger: console,
};
const nacosClient = new nacos.NacosNamingClient(nacosConfig);

async function registerToNacos() {
  try {
    await nacosClient.ready();
    await nacosClient.registerInstance('req2task.ai-chat-service', {
      ip: getIP(),
      port: 4001,
      instanceId: getIP(),
      weight: 1,
      healthy: false,
      enabled: true,
    });
    logger.info('Nacos naming client connected successfully');
  } catch (error) {
    logger.warn({ error }, 'Nacos naming client connection failed');
  }
}

export async function createApp(): Promise<Express> {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  await initializeDatabase();
  logger.info('Database initialized');

  await registerToNacos();

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

  app.use('/api/ai/conversations', createConversationRoutes(conversationService, llmService));
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
