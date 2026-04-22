import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Requirement, UserStory, AcceptanceCriteria, Task, FeatureModule } from '@req2task/core';
import { PromptModule } from '@req2task/core';
import { AiService } from './ai.service';
import { LLmClientService } from './llm-client.service';
import { AiGenerationService } from './ai-generation.service';
import { AiGenerationController } from './ai-generation.controller';
import { ConversationClient } from './conversation.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([Requirement, UserStory, AcceptanceCriteria, Task, FeatureModule]),
    PromptModule,
  ],
  controllers: [AiGenerationController],
  providers: [
    AiService,
    LLmClientService,
    AiGenerationService,
    ConversationClient,
  ],
  exports: [
    AiService,
    LLmClientService,
    AiGenerationService,
    ConversationClient,
  ],
})
export class AiModule {}
