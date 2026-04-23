import { Module, Global } from '@nestjs/common';
import { RenderService } from './render.service';
import { PromptService } from './prompt.service';

@Global()
@Module({
  providers: [RenderService, PromptService],
  exports: [RenderService, PromptService],
})
export class PromptModule {}
