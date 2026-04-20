import { Controller, All, Req, Headers, Query, Body, Res, HttpCode } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { Logger } from '../common/utils/logger';

@Controller('*')
export class ProxyController {
  private readonly logger = new Logger('ProxyController');

  @All()
  @HttpCode(200)
  async handleAll(@Req() req: Request, @Res() res: Response) {
    const method = req.method;
    const path = req.originalUrl;
    const headers = req.headers as Record<string, string>;
    const query = req.query as Record<string, any>;
    const body = req.body;

    try {
      const response = await this['proxyService'].forward(method, path, headers, body, query);

      Object.entries(response.headers || {}).forEach(([key, value]) => {
        if (key !== 'content-encoding' && key !== 'transfer-encoding') {
          res.setHeader(key, value as string);
        }
      });

      res.status(response.status).send(response.data);
    } catch (error) {
      this.logger.error(`代理请求失败: ${error.message}`);
      const status = error.status || 500;
      res.status(status).json({
        statusCode: status,
        message: error.message || 'Proxy error',
      });
    }
  }
}
