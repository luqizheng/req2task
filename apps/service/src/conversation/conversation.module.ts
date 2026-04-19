import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Conversation,
  ConversationMessage,
  RawRequirement,
  LLMService,
  PromptService,
} from '@req2task/core';
import { ConversationController } from './conversation.controller';
import { ConversationService } from '@req2task/core';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ConversationMessage, RawRequirement]),
  ],
  controllers: [ConversationController],
  providers: [ConversationService, LLMService, PromptService],
  exports: [ConversationService],
})
export class ConversationModule {}
