import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { RequirementGenerationService } from './requirement-generation.service';
import { ConflictDetectionService } from './conflict-detection.service';
import {
  LLMConfig,
  RawRequirement,
  LLMService,
  PromptService,
  ChromaVectorStore,
} from '@req2task/core';

@Module({
  imports: [TypeOrmModule.forFeature([LLMConfig, RawRequirement])],
  controllers: [AiController],
  providers: [
    AiService,
    RequirementGenerationService,
    ConflictDetectionService,
    LLMService,
    PromptService,
    ChromaVectorStore,
  ],
  exports: [AiService, RequirementGenerationService, ConflictDetectionService],
})
export class AiModule {}
