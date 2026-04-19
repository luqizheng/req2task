import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Sse,
  MessageEvent,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AIChatService, ChatContext, SendMessageDto } from '@req2task/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

interface SendMessageRequest {
  content: string;
  files?: Array<{ type: 'text' | 'docx' | 'pdf' | 'audio'; data: string; name?: string }>;
  configId?: string;
  systemPrompt?: string;
}

interface CreateConversationRequest {
  collectionId?: string;
  rawRequirementId?: string;
  title?: string;
  systemPrompt?: string;
}

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

@Controller('ai-chat')
@UseGuards(AuthGuard('jwt'))
export class AIChatController {
  constructor(private readonly aiChatService: AIChatService) {}

  @Post('conversations')
  async createConversation(
    @Body() dto: CreateConversationRequest,
  ): Promise<ApiResponse<{ id: string }>> {
    const context: ChatContext = {
      collectionId: dto.collectionId,
      rawRequirementId: dto.rawRequirementId,
      title: dto.title,
      systemPrompt: dto.systemPrompt,
    };
    const conversation = await this.aiChatService.createConversation(context);
    return { code: 0, data: { id: conversation.id } };
  }

  @Get('conversations/:conversationId')
  async getConversation(
    @Param('conversationId') conversationId: string,
  ): Promise<ApiResponse<unknown>> {
    const conversation = await this.aiChatService.getConversation(conversationId);
    return { code: 0, data: conversation };
  }

  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<ApiResponse<unknown>> {
    const messages = await this.aiChatService.getMessages(
      conversationId,
      limit || 100,
      offset || 0,
    );
    return { code: 0, data: messages };
  }

  @Post('conversations/:conversationId/messages')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageRequest,
  ): Promise<ApiResponse<unknown>> {
    const sendDto: SendMessageDto = {
      content: dto.content,
      files: dto.files,
    };
    const result = await this.aiChatService.sendMessage(
      conversationId,
      sendDto,
      dto.configId,
      dto.systemPrompt,
    );
    return { code: 0, data: result };
  }

  @Sse('conversations/:conversationId/stream')
  async streamMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageRequest,
    @Res() res: Response,
  ): Promise<Observable<MessageEvent>> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const sendDto: SendMessageDto = {
      content: dto.content,
      files: dto.files,
    };

    const stream$ = from(
      (async () => {
        try {
          for await (const chunk of this.aiChatService.streamMessage(
            conversationId,
            sendDto,
            dto.configId,
            dto.systemPrompt,
          )) {
            if (chunk.content && !chunk.done) {
              res.write(`data: ${JSON.stringify({ type: 'content', content: chunk.content })}\n\n`);
            } else if (chunk.done && chunk.content) {
              try {
                const parsed = JSON.parse(chunk.content);
                res.write(`data: ${JSON.stringify({ type: 'metadata', ...parsed })}\n\n`);
              } catch {
                res.write(`data: ${JSON.stringify({ type: 'done', content: chunk.content })}\n\n`);
              }
            }
            if (chunk.messageId && chunk.conversationId) {
              res.write(`data: ${JSON.stringify({ type: 'info', messageId: chunk.messageId, conversationId: chunk.conversationId })}\n\n`);
            }
          }
          res.write('data: [DONE]\n\n');
        } catch (error) {
          res.write(`data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`);
        } finally {
          res.end();
        }
      })(),
    );

    return stream$.pipe(map(() => ({ data: '' })));
  }

  @Delete('conversations/:conversationId')
  async clearConversation(
    @Param('conversationId') conversationId: string,
  ): Promise<ApiResponse<null>> {
    await this.aiChatService.clearConversation(conversationId);
    return { code: 0, message: 'Conversation cleared' };
  }

  @Post('conversations/:conversationId/continue')
  async continueConversation(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageRequest,
  ): Promise<ApiResponse<unknown>> {
    const sendDto: SendMessageDto = {
      content: dto.content,
      files: dto.files,
    };

    const conversation = await this.aiChatService.getConversation(conversationId);
    if (!conversation) {
      return { code: 1, message: 'Conversation not found' };
    }

    const context: ChatContext = {
      collectionId: conversation.collectionId || undefined,
      rawRequirementId: conversation.rawRequirementId || undefined,
    };

    const chatConversation = await this.aiChatService.getOrCreateConversation(context);

    const result = await this.aiChatService.sendMessage(
      chatConversation.id,
      sendDto,
      dto.configId,
      dto.systemPrompt,
    );

    return { code: 0, data: result };
  }

  @Sse('conversations/:conversationId/continue/stream')
  async continueStream(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageRequest,
    @Res() res: Response,
  ): Promise<Observable<MessageEvent>> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const conversation = await this.aiChatService.getConversation(conversationId);
    const sendDto: SendMessageDto = {
      content: dto.content,
      files: dto.files,
    };

    const context: ChatContext = {
      collectionId: conversation?.collectionId || undefined,
      rawRequirementId: conversation?.rawRequirementId || undefined,
    };

    const chatConversation = await this.aiChatService.getOrCreateConversation(context);

    const stream$ = from(
      (async () => {
        try {
          res.write(`data: ${JSON.stringify({ type: 'metadata', conversationId: chatConversation.id })}\n\n`);

          for await (const chunk of this.aiChatService.streamMessage(
            chatConversation.id,
            sendDto,
            dto.configId,
            dto.systemPrompt,
          )) {
            if (chunk.content && !chunk.done) {
              res.write(`data: ${JSON.stringify({ type: 'content', content: chunk.content })}\n\n`);
            } else if (chunk.done && chunk.content) {
              try {
                const parsed = JSON.parse(chunk.content);
                res.write(`data: ${JSON.stringify({ type: 'metadata', ...parsed })}\n\n`);
              } catch {
                res.write(`data: ${JSON.stringify({ type: 'done', content: chunk.content })}\n\n`);
              }
            }
          }
          res.write('data: [DONE]\n\n');
        } catch (error) {
          res.write(`data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`);
        } finally {
          res.end();
        }
      })(),
    );

    return stream$.pipe(map(() => ({ data: '' })));
  }
}
