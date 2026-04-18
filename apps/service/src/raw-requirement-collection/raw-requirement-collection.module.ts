import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RawRequirementCollection } from '@req2task/core';
import { RawRequirement } from '@req2task/core';
import { RawRequirementCollectionService } from './raw-requirement-collection.service';
import { RawRequirementCollectionController } from './raw-requirement-collection.controller';
import { RequirementGenerationService } from '../ai/requirement-generation.service';
import { LLMService, PromptService, ChromaVectorStore } from '@req2task/core';

@Module({
  imports: [TypeOrmModule.forFeature([RawRequirementCollection, RawRequirement])],
  controllers: [RawRequirementCollectionController],
  providers: [
    RawRequirementCollectionService,
    RequirementGenerationService,
    LLMService,
    PromptService,
    ChromaVectorStore,
  ],
  exports: [RawRequirementCollectionService],
})
export class RawRequirementCollectionModule {}
