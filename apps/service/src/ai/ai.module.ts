import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { RequirementGenerationService } from './requirement-generation.service';
import { ConflictDetectionService } from './conflict-detection.service';
import { TaskDecompositionService } from './task-decomposition.service';
import {
  LLMConfig,
  RawRequirement,
  Task,
  LLMService,
  PromptService,
  ChromaVectorStore,
} from '@req2task/core';

@Module({
  imports: [TypeOrmModule.forFeature([LLMConfig, RawRequirement, Task])],
  controllers: [AiController],
  providers: [
    AiService,
    RequirementGenerationService,
    ConflictDetectionService,
    TaskDecompositionService,
    LLMService,
    PromptService,
    ChromaVectorStore,
  ],
  exports: [
    AiService,
    RequirementGenerationService,
    ConflictDetectionService,
    TaskDecompositionService,
  ],
})
export class AiModule {}
