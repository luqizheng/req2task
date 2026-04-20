import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule, HttpService } from '@nestjs/axios';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { RequirementGenerationService } from './requirement-generation.service';
import { ConflictDetectionService } from './conflict-detection.service';
import { TaskDecompositionService } from './task-decomposition.service';
import { AIChatService } from './ai-chat.service';
import {
  LlmConfigController,
  RequirementGenerationController,
  VectorStoreController,
  ConflictDetectionController,
  TaskDecompositionController,
  AIChatController,
} from './controllers';
import {
  LLMConfig,
  RawRequirement,
  Task,
  LLMService,
  PromptService,
  RenderService,
  ChromaVectorStore,
  FileParserService,
} from '@req2task/core';
import { Repository } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([LLMConfig, RawRequirement, Task]),
    HttpModule,
  ],
  controllers: [
    LlmConfigController,
    RequirementGenerationController,
    VectorStoreController,
    ConflictDetectionController,
    TaskDecompositionController,
    AIChatController,
  ],
  providers: [
    AiService,
    RequirementGenerationService,
    ConflictDetectionService,
    TaskDecompositionService,
    {
      provide: LLMService,
      inject: [getRepositoryToken(LLMConfig)],
      useFactory: (llmConfigRepository: Repository<LLMConfig>) => {
        return new LLMService(llmConfigRepository);
      },
    },
    {
      provide: PromptService,
      useFactory: () => {
        const renderService = new RenderService();
        return new PromptService(renderService);
      },
    },
    {
      provide: RenderService,
      useFactory: () => {
        return new RenderService();
      },
    },
    {
      provide: ChromaVectorStore,
      useFactory: () => {
        return new ChromaVectorStore();
      },
    },
    {
      provide: FileParserService,
      useFactory: () => {
        return new FileParserService();
      },
    },
    {
      provide: AIChatService,
      inject: [HttpModule, FileParserService, PromptService],
      useFactory: (httpService: HttpService, fileParserService: FileParserService, promptService: PromptService) => {
        return new AIChatService(httpService, fileParserService, promptService);
      },
    },
  ],
  exports: [
    AiService,
    RequirementGenerationService,
    ConflictDetectionService,
    TaskDecompositionService,
    LLMService,
    PromptService,
    RenderService,
    ChromaVectorStore,
    FileParserService,
    AIChatService,
  ],
})
export class AiModule {}
