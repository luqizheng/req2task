import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RawRequirementCollectionService } from './raw-requirement-collection.service';
import { RequirementGenerationService } from '../ai/requirement-generation.service';
import { AIChatService, SendMessageDto } from '@req2task/core';
import {
  CreateRawRequirementCollectionDto,
  UpdateRawRequirementCollectionDto,
  AddRawRequirementDto,
} from '@req2task/dto';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

interface AuthenticatedRequest {
  user: {
    userId: string;
    username: string;
  };
}

interface ChatRequest {
  message: string;
  configId?: string;
  files?: Array<{ type: 'text' | 'docx' | 'pdf' | 'audio'; data: string; name?: string }>;
  systemPrompt?: string;
}

@Controller('collections')
@UseGuards(AuthGuard('jwt'))
export class RawRequirementCollectionController {
  constructor(
    private readonly collectionService: RawRequirementCollectionService,
    private readonly requirementGenerationService: RequirementGenerationService,
    private readonly aiChatService: AIChatService,
  ) {}

  @Post()
  async createCollection(
    @Body() dto: CreateRawRequirementCollectionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<unknown>> {
    const user = req.user as { id?: string; userId?: string };
    const userId = user.id || user.userId;
    const result = await this.collectionService.create(dto, userId!);
    return { code: 0, data: result };
  }

  @Get()
  async getCollections(
    @Query('projectId') projectId: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.findAllByProject(projectId);
    return { code: 0, data: result };
  }

  @Get(':id')
  async getCollection(
    @Param('id') id: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.findByIdWithDetails(id);
    return { code: 0, data: result };
  }

  @Put(':id')
  async updateCollection(
    @Param('id') id: string,
    @Body() dto: UpdateRawRequirementCollectionDto,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.update(id, dto);
    return { code: 0, data: result };
  }

  @Delete(':id')
  async deleteCollection(
    @Param('id') id: string,
  ): Promise<ApiResponse<null>> {
    await this.collectionService.delete(id);
    return { code: 0, message: '删除成功' };
  }

  @Post(':id/complete')
  async completeCollection(
    @Param('id') id: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.complete(id);
    return { code: result.success ? 0 : 1, data: result, message: result.message };
  }

  @Post(':id/raw-requirements')
  async addRawRequirement(
    @Param('id') collectionId: string,
    @Body() dto: AddRawRequirementDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<unknown>> {
    const user = req.user as { id?: string; userId?: string };
    const userId = user.id || user.userId;
    const result = await this.collectionService.addRawRequirement(
      collectionId,
      dto.content,
      dto.source,
      userId!,
    );
    return { code: 0, data: result };
  }

  @Get(':id/raw-requirements')
  async getRawRequirements(
    @Param('id') collectionId: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.getRawRequirements(collectionId);
    return { code: 0, data: result };
  }

  @Get('raw-requirements/:rawRequirementId')
  async getRawRequirement(
    @Param('rawRequirementId') rawRequirementId: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.getRawRequirementById(rawRequirementId);
    return { code: 0, data: result };
  }

  @Post('raw-requirements/:rawRequirementId/chat')
  async chatCollect(
    @Param('rawRequirementId') rawRequirementId: string,
    @Body() dto: ChatRequest,
  ): Promise<ApiResponse<unknown>> {
    const rawRequirement = await this.collectionService.getRawRequirementById(rawRequirementId);
    if (!rawRequirement) {
      return { code: 1, message: 'Raw requirement not found' };
    }

    const conversation = await this.aiChatService.getOrCreateConversation({
      rawRequirementId,
      title: `Chat for requirement ${rawRequirementId}`,
      systemPrompt: dto.systemPrompt || 'You are a helpful requirements analyst.',
    });

    const sendDto: SendMessageDto = {
      content: dto.message,
      files: dto.files,
    };

    const result = await this.aiChatService.sendMessage(
      conversation.id,
      sendDto,
      dto.configId,
    );

    return { code: 0, data: result };
  }

  @Sse('raw-requirements/:rawRequirementId/stream')
  streamChatCollect(
    @Param('rawRequirementId') rawRequirementId: string,
    @Body() dto: ChatRequest,
    @Res() res: Response,
  ): Observable<MessageEvent> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    return from(
      (async () => {
        const rawRequirement = await this.collectionService.getRawRequirementById(rawRequirementId);
        if (!rawRequirement) {
          res.write(`data: ${JSON.stringify({ type: 'error', error: 'Raw requirement not found' })}\n\n`);
          res.end();
          return;
        }

        const conversation = await this.aiChatService.getOrCreateConversation({
          rawRequirementId,
          title: `Chat for requirement ${rawRequirementId}`,
          systemPrompt: dto.systemPrompt || 'You are a helpful requirements analyst.',
        });

        const sendDto: SendMessageDto = {
          content: dto.message,
          files: dto.files,
        };

        try {
          res.write(`data: ${JSON.stringify({ type: 'metadata', conversationId: conversation.id })}\n\n`);

          for await (const chunk of this.aiChatService.streamMessage(
            conversation.id,
            sendDto,
            dto.configId,
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
    ).pipe(map(() => ({ data: '' })));
  }

  @Delete('raw-requirements/:rawRequirementId')
  async deleteRawRequirement(
    @Param('rawRequirementId') rawRequirementId: string,
  ): Promise<ApiResponse<null>> {
    await this.collectionService.deleteRawRequirement(rawRequirementId);
    return { code: 0, message: '删除成功' };
  }

  @Post(':id/chat')
  async chatWithCollection(
    @Param('id') collectionId: string,
    @Body() dto: ChatRequest,
    @Body('source') source: string = 'chat',
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<unknown>> {
    const user = req.user as { id?: string; userId?: string };
    const userId = user.id || user.userId;

    const rawRequirement = await this.collectionService.addRawRequirement(
      collectionId,
      dto.message,
      source,
      userId!,
    );

    const conversation = await this.aiChatService.getOrCreateConversation({
      collectionId,
      rawRequirementId: rawRequirement.id,
      title: `Chat for collection ${collectionId}`,
      systemPrompt: dto.systemPrompt || 'You are a helpful requirements analyst.',
    });

    const sendDto: SendMessageDto = {
      content: dto.message,
      files: dto.files,
    };

    const result = await this.aiChatService.sendMessage(
      conversation.id,
      sendDto,
      dto.configId,
    );

    return {
      code: 0,
      data: {
        rawRequirementId: rawRequirement.id,
        conversationId: conversation.id,
        ...result,
      },
    };
  }

  @Sse(':id/stream')
  streamChatWithCollection(
    @Param('id') collectionId: string,
    @Body() dto: ChatRequest,
    @Body('source') source: string = 'chat',
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Observable<MessageEvent> {
    const user = req.user as { id?: string; userId?: string };
    const userId = user.id || user.userId;

    return from(
      (async () => {
        const rawRequirement = await this.collectionService.addRawRequirement(
          collectionId,
          dto.message,
          source,
          userId!,
        );

        const conversation = await this.aiChatService.getOrCreateConversation({
          collectionId,
          rawRequirementId: rawRequirement.id,
          title: `Chat for collection ${collectionId}`,
          systemPrompt: dto.systemPrompt || 'You are a helpful requirements analyst.',
        });

        const sendDto: SendMessageDto = {
          content: dto.message,
          files: dto.files,
        };

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        try {
          res.write(`data: ${JSON.stringify({ type: 'metadata', isNewConversation: true, rawRequirementId: rawRequirement.id, conversationId: conversation.id })}\n\n`);

          for await (const chunk of this.aiChatService.streamMessage(
            conversation.id,
            sendDto,
            dto.configId,
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
    ).pipe(map(() => ({ data: '' })));
  }
}
