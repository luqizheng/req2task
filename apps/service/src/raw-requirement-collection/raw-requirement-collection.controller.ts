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
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RawRequirementCollectionService } from './raw-requirement-collection.service';
import { RequirementGenerationService } from '../ai/requirement-generation.service';
import { AIChatClientService } from '../ai/ai-chat-client.service';
import {
  CreateRawRequirementCollectionDto,
  UpdateRawRequirementCollectionDto,
  AddRawRequirementDto,
} from '@req2task/dto';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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
    private readonly aiChatClient: AIChatClientService,
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

    const conversation = await this.aiChatClient.getOrCreateConversation({
      rawRequirementId,
      title: `Chat for requirement ${rawRequirementId}`,
      systemPrompt: dto.systemPrompt || 'You are a helpful requirements analyst.',
    });

    const result = await this.aiChatClient.sendMessage(conversation.id, {
      content: dto.message,
      files: dto.files,
      configId: dto.configId,
    });

    return { code: 0, data: result };
  }

  @Post('raw-requirements/:rawRequirementId/stream')
  streamChatCollect(
    @Param('rawRequirementId') rawRequirementId: string,
    @Body() dto: ChatRequest,
    @Res() res: Response,
  ) {
    return of(null).pipe(
      map(async () => {
        const rawRequirement = await this.collectionService.getRawRequirementById(rawRequirementId);
        if (!rawRequirement) {
          res.write(`data: ${JSON.stringify({ type: 'error', error: 'Raw requirement not found' })}\n\n`);
          res.end();
          return;
        }

        const conversation = await this.aiChatClient.getOrCreateConversation({
          rawRequirementId,
          title: `Chat for requirement ${rawRequirementId}`,
          systemPrompt: dto.systemPrompt || 'You are a helpful requirements analyst.',
        });

        const streamUrl = this.aiChatClient.getStreamUrl(conversation.id, {
          content: dto.message,
          files: dto.files,
          configId: dto.configId,
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        try {
          const http = await import('http');
          const url = new URL(streamUrl);
          const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          };

          const proxyReq = http.request(options, (proxyRes) => {
            proxyRes.pipe(res, { end: true });
          });

          proxyReq.on('error', (error) => {
            res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
            res.end();
          });

          proxyReq.end();
        } catch (error) {
          res.write(`data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`);
          res.end();
        }
      }),
      catchError((error) => {
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
        return of(null);
      }),
    );
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

    const conversation = await this.aiChatClient.getOrCreateConversation({
      collectionId,
      rawRequirementId: rawRequirement.id,
      title: `Chat for collection ${collectionId}`,
      systemPrompt: dto.systemPrompt || 'You are a helpful requirements analyst.',
    });

    const result = await this.aiChatClient.sendMessage(conversation.id, {
      content: dto.message,
      files: dto.files,
      configId: dto.configId,
    });

    return {
      code: 0,
      data: {
        rawRequirementId: rawRequirement.id,
        conversationId: conversation.id,
        ...(result as object),
      },
    };
  }

  @Post(':id/stream')
  streamChatWithCollection(
    @Param('id') collectionId: string,
    @Query() query: ChatRequest,
    @Query('source') source: string = 'chat',
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    return of(null).pipe(
      map(async () => {
        const user = req.user as { id?: string; userId?: string };
        const userId = user.id || user.userId;

        const rawRequirement = await this.collectionService.addRawRequirement(
          collectionId,
          query.message,
          source,
          userId!,
        );

        const conversation = await this.aiChatClient.getOrCreateConversation({
          collectionId,
          rawRequirementId: rawRequirement.id,
          title: `Chat for collection ${collectionId}`,
          systemPrompt: query.systemPrompt || 'You are a helpful requirements analyst.',
        });

        const streamUrl = this.aiChatClient.getStreamUrl(conversation.id, {
          content: query.message,
          files: query.files,
          configId: query.configId,
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        try {
          res.write(`data: ${JSON.stringify({ type: 'metadata', isNewConversation: true, rawRequirementId: rawRequirement.id, conversationId: conversation.id })}\n\n`);

          const http = await import('http');
          const url = new URL(streamUrl);
          const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          };

          const proxyReq = http.request(options, (proxyRes) => {
            proxyRes.pipe(res, { end: true });
          });

          proxyReq.on('error', (error) => {
            res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
            res.end();
          });

          proxyReq.end();
        } catch (error) {
          res.write(`data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`);
          res.end();
        }
      }),
      catchError((error) => {
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
        return of(null);
      }),
    );
  }
}
