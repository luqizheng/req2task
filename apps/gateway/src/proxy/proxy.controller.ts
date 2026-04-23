import { Controller, All, Req, Res, HttpCode, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '../common/utils/logger';
import { ProxyService } from './proxy.service';

@Controller('*')
export class ProxyController {
  private readonly logger = new Logger('ProxyController');

  constructor(@Inject(ProxyService) private readonly proxyService: ProxyService) {}

  @All()
  @HttpCode(200)
  async handleAll(@Req() req: Request, @Res() res: Response) {
    const method = req.method;
    const path = req.originalUrl;
    const headers = req.headers as Record<string, string>;
    const query = req.query as Record<string, any>;
    const body = req.body;

    try {
      const response = await this.proxyService.forward(method, path, headers, body, query);

      Object.entries(response.headers || {}).forEach(([key, value]) => {
        if (key !== 'content-encoding' && key !== 'transfer-encoding') {
          res.setHeader(key, value as string);
        }
      });

      res.status(response.status).send(response.data);
    } catch (error) {
      const errorInfo = {
        message: error.message || 'Proxy error',
        method,
        path,
        stack: error.stack,
        name: error.name,
      };
      this.logger.error(`代理请求失败: ${JSON.stringify(errorInfo)}`);
      const status = error.status || 500;
      res.status(status).json({
        statusCode: status,
        message: error.message || 'Proxy error',
        error: error.name,
        path,
        method,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
