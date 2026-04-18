import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { RequirementGenerationService } from './requirement-generation.service';
import { ConflictDetectionService } from './conflict-detection.service';
import { TaskDecompositionService } from './task-decomposition.service';
import {
  LlmConfigController,
  RequirementGenerationController,
  VectorStoreController,
  ConflictDetectionController,
  TaskDecompositionController,
} from './controllers';
import {
  LLMConfig,
  RawRequirement,
  Task,
  LLMService,
  PromptService,
  RenderService,
  ChromaVectorStore,
} from '@req2task/core';
import { Repository } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([LLMConfig, RawRequirement, Task])],
  controllers: [
    LlmConfigController,
    RequirementGenerationController,
    VectorStoreController,
    ConflictDetectionController,
    TaskDecompositionController,
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
  ],
})
export class AiModule {}
