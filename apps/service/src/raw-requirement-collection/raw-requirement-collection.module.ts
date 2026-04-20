import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { RawRequirementCollection } from '@req2task/core';
import { RawRequirement } from '@req2task/core';
import { RawRequirementCollectionService } from './raw-requirement-collection.service';
import { RawRequirementCollectionController } from './raw-requirement-collection.controller';
import { RequirementGenerationService } from '../ai/requirement-generation.service';
import { LLMService, PromptService, ChromaVectorStore, FileParserService } from '@req2task/core';
import { AIChatClientService } from '../ai/ai-chat-client.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RawRequirementCollection, RawRequirement]),
    HttpModule,
  ],
  controllers: [RawRequirementCollectionController],
  providers: [
    RawRequirementCollectionService,
    RequirementGenerationService,
    LLMService,
    PromptService,
    ChromaVectorStore,
    FileParserService,
    AIChatClientService,
  ],
  exports: [RawRequirementCollectionService, AIChatClientService],
})
export class RawRequirementCollectionModule {}
