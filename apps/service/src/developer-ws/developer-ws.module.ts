import { Module } from '@nestjs/common';
import { DeveloperWsGateway } from './developer-ws.gateway';
import { RunnerManagerService } from './runner-manager.service';
import { DeveloperSessionService } from './developer-session.service';

@Module({
  providers: [DeveloperWsGateway, RunnerManagerService, DeveloperSessionService],
  exports: [DeveloperWsGateway, RunnerManagerService, DeveloperSessionService],
})
export class DeveloperWsModule {}
