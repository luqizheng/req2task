import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as os from 'os';
import * as nacos from 'nacos';
import { createConvertRoutes } from './routes/convert.routes.js';
import { ConversionService } from './services/conversion.service.js';

const getIP = (): string => {
  const nets = os.networkInterfaces();
  let serverIp = '';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
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
    await nacosClient.registerInstance('req2task.file-conversion', {
      ip: getIP(),
      port: 4002,
      instanceId: getIP(),
      weight: 1,
      healthy: false,
      enabled: true,
    });
    console.log('Nacos naming client connected successfully');
  } catch (error) {
    console.warn('Nacos naming client connection failed:', error);
  }
}

export async function createApp(): Promise<Express> {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '100mb' }));

  await registerToNacos();

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
