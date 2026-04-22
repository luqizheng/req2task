import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Requirement, UserStory, AcceptanceCriteria, Task, FeatureModule, RawRequirement, ChromaVectorStore } from '@req2task/core';
import { PromptModule } from '@req2task/core';
import { AiService } from './ai.service';
import { LLmClientService } from './llm-client.service';
import { AiGenerationService } from './ai-generation.service';
import { AiGenerationController } from './ai-generation.controller';
import { ConversationClient } from './conversation.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([Requirement, UserStory, AcceptanceCriteria, Task, FeatureModule, RawRequirement]),
    HttpModule,
    PromptModule,
  ],
  controllers: [AiGenerationController],
  providers: [
    ChromaVectorStore,
    AiService,
    LLmClientService,
    AiGenerationService,
    ConversationClient,
  ],
  exports: [
    ChromaVectorStore,
    AiService,
    LLmClientService,
    AiGenerationService,
    ConversationClient,
  ],
})
export class AiModule {}
