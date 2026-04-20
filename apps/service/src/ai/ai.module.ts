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
  AIChatController,
  AIConversationController,
} from './controllers';
import {
  LLMConfig,
  RawRequirement,
  Task,
  Conversation,
  ConversationMessage,
  LLMService,
  PromptService,
  RenderService,
  ChromaVectorStore,
  AIChatService,
  AIConversationService,
  FileParserService,
} from '@req2task/core';
import { Repository } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([LLMConfig, RawRequirement, Task, Conversation, ConversationMessage])],
  controllers: [
    LlmConfigController,
    RequirementGenerationController,
    VectorStoreController,
    ConflictDetectionController,
    TaskDecompositionController,
    AIChatController,
    AIConversationController,
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
      provide: AIChatService,
      inject: [
        getRepositoryToken(Conversation),
        getRepositoryToken(ConversationMessage),
      ],
      useFactory: (
        conversationRepo: Repository<Conversation>,
        messageRepo: Repository<ConversationMessage>,
        llmService: LLMService,
        fileParser: FileParserService,
      ) => {
        return new AIChatService(
          conversationRepo,
          messageRepo,
          llmService,
          fileParser,
        );
      },
    },
    {
      provide: FileParserService,
      useFactory: () => {
        return new FileParserService();
      },
    },
    {
      provide: AIConversationService,
      inject: [
        getRepositoryToken(Conversation),
        getRepositoryToken(ConversationMessage),
      ],
      useFactory: (
        conversationRepo: Repository<Conversation>,
        messageRepo: Repository<ConversationMessage>,
        llmService: LLMService,
        fileParser: FileParserService,
      ) => {
        return new AIConversationService(
          conversationRepo,
          messageRepo,
          llmService,
          fileParser,
        );
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
    AIChatService,
    AIConversationService,
    FileParserService,
  ],
})
export class AiModule {}
