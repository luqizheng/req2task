import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RawRequirementCollection } from '@req2task/core';
import { RawRequirement } from '@req2task/core';
import { Conversation } from '@req2task/core';
import { ConversationMessage } from '@req2task/core';
import { RawRequirementCollectionService } from './raw-requirement-collection.service';
import { RawRequirementCollectionController } from './raw-requirement-collection.controller';
import { RequirementGenerationService } from '../ai/requirement-generation.service';
import { LLMService, PromptService, ChromaVectorStore, AIChatService, FileParserService } from '@req2task/core';
import { Repository } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([RawRequirementCollection, RawRequirement, Conversation, ConversationMessage])],
  controllers: [RawRequirementCollectionController],
  providers: [
    RawRequirementCollectionService,
    RequirementGenerationService,
    LLMService,
    PromptService,
    ChromaVectorStore,
    {
      provide: AIChatService,
      inject: [
        getRepositoryToken(Conversation),
        getRepositoryToken(ConversationMessage),
      ],
      useFactory: (
        conversationRepo: Repository<Conversation>,
        messageRepo: Repository<ConversationMessage>,
      ) => {
        return new AIChatService(
          conversationRepo,
          messageRepo,
          new LLMService(null as any),
          new FileParserService(),
        );
      },
    },
  ],
  exports: [RawRequirementCollectionService, AIChatService],
})
export class RawRequirementCollectionModule {}
