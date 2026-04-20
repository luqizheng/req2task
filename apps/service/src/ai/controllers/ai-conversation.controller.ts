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
import { AIConversationService } from '@req2task/core';
import {
  CreateSessionOptionsDto,
  SessionInfoDto,
  SessionChatResultDto,
  SendMessageDto,
} from '@req2task/dto';
import { Observable, from } from 'rxjs';

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

@Controller('ai/conversations')
@UseGuards(AuthGuard('jwt'))
export class AIConversationController {
  constructor(private readonly aiConversationService: AIConversationService) {}

  @Post()
  async createSession(
    @Body() dto: CreateSessionOptionsDto,
  ): Promise<ApiResponse<{ id: string }>> {
    const session = await this.aiConversationService.createSession(dto);
    return { code: 0, data: { id: session.id } };
  }

  @Get(':id')
  async getSession(
    @Param('id') id: string,
  ): Promise<ApiResponse<SessionInfoDto | null>> {
    const session = await this.aiConversationService.getSessionInfo(id);
    return { code: 0, data: session };
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<ApiResponse<unknown>> {
    const messages = await this.aiConversationService.getMessages(
      id,
      limit || 100,
      offset || 0,
    );
    return { code: 0, data: messages };
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ): Promise<ApiResponse<SessionChatResultDto>> {
    const result = await this.aiConversationService.sendMessage(id, dto);
    return { code: 0, data: result as SessionChatResultDto };
  }

  @Sse(':id/stream')
  streamMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ): Observable<MessageEvent> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    return new Observable<MessageEvent>((observer) => {
      (async () => {
        try {
          for await (const chunk of this.aiConversationService.streamMessage(id, dto)) {
            if (chunk.content && !chunk.done) {
              observer.next({ data: JSON.stringify({ type: 'content', content: chunk.content }) });
            } else if (chunk.done && chunk.content) {
              try {
                const parsed = JSON.parse(chunk.content);
                observer.next({ data: JSON.stringify({ type: 'metadata', ...parsed }) });
              } catch {
                observer.next({ data: JSON.stringify({ type: 'done', content: chunk.content }) });
              }
            }
            if (chunk.messageId) {
              observer.next({ data: JSON.stringify({ type: 'info', messageId: chunk.messageId }) });
            }
          }
          observer.next({ data: JSON.stringify({ type: 'end' }) });
          observer.complete();
        } catch (error) {
          observer.error(new Error('Stream error'));
        }
      })();
    });
  }

  @Delete(':id')
  async clearSession(
    @Param('id') id: string,
  ): Promise<ApiResponse<null>> {
    await this.aiConversationService.clearSession(id);
    return { code: 0, message: 'Session cleared' };
  }

  @Post(':id/archive')
  async archiveSession(
    @Param('id') id: string,
  ): Promise<ApiResponse<null>> {
    await this.aiConversationService.archiveSession(id);
    return { code: 0, message: 'Session archived' };
  }

  @Post(':id/link/:nextId')
  async linkToNext(
    @Param('id') currentId: string,
    @Param('nextId') nextId: string,
  ): Promise<ApiResponse<null>> {
    await this.aiConversationService.linkToNext(currentId, nextId);
    return { code: 0, message: 'Sessions linked' };
  }
}
