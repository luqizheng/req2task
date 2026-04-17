import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Hello from req2task service!'
  }

  @Get('health')
  healthCheck(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'req2task-service',
      timestamp: new Date().toISOString(),
    }
  }
}
