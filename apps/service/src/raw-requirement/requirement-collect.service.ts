import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { RawRequirementService } from './raw-requirement.service';
import { AIChatClientService } from '../ai/ai-chat-client.service';
import { FileConversionClientService } from '../common/services/file-conversion-client.service';
import { ProjectAttachmentService } from '../project-attachment/project-attachment.service';
import { CollectRequirementDto } from '@req2task/dto';

export interface StreamChunk {
  type: 'content' | 'metadata' | 'done' | 'error';
  content?: string;
  followUpQuestions?: string[];
  keyElements?: string[];
  error?: string;
}

@Injectable()
export class RequirementCollectService {
  private readonly logger = new Logger(RequirementCollectService.name);

  constructor(
    private readonly rawRequirementService: RawRequirementService,
    private readonly aiChatClient: AIChatClientService,
    private readonly fileConversionClient: FileConversionClientService,
    private readonly projectAttachmentService: ProjectAttachmentService,
  ) {}

  async collect(
    rawRequirementId: string,
    dto: CollectRequirementDto,
    res: Response,
  ): Promise<void> {
    this.setupSseHeaders(res);

    try {
      const rawRequirement = await this.rawRequirementService.getRawRequirementById(rawRequirementId);
      if (!rawRequirement) {
        this.sendError(res, 'Raw requirement not found');
        return;
      }

      const content = await this.prepareContent(dto);
      if (!content) {
        this.sendError(res, 'No content provided. Please provide text or audio file.');
        return;
      }

      if (dto.attachmentIds?.length && dto.projectId) {
        await this.processAttachments(dto.attachmentIds, dto.projectId);
      }

      const conversation = await this.aiChatClient.getOrCreateConversation({
        rawRequirementId,
        title: `Collect for requirement ${rawRequirementId}`,
        systemPrompt: 'You are a helpful requirements analyst. Analyze the user requirement and provide structured feedback with follow-up questions.',
      });

      const streamUrl = this.aiChatClient.getStreamUrl(conversation.id, {
        content,
        configId: dto.configId,
      });

      this.logger.log(`Starting SSE stream: ${streamUrl}`);
      await this.proxySseStream(streamUrl, res);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal error';
      this.logger.error(`Collect error: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      this.sendError(res, errorMessage);
    }
  }

  private async prepareContent(dto: CollectRequirementDto): Promise<string | null> {
    const parts: string[] = [];

    if (dto.content) {
      parts.push(dto.content);
    }

    if (dto.audioFile) {
      const transcription = await this.transcribeAudio(dto.audioFile);
      if (transcription) {
        parts.push(`[语音转写]\n${transcription}`);
      } else {
        this.logger.warn('Audio transcription failed or returned empty');
      }
    }

    if (parts.length === 0) {
      return null;
    }

    return parts.join('\n\n');
  }

  private async transcribeAudio(audioFile: CollectRequirementDto['audioFile']): Promise<string | null> {
    if (!audioFile) {
      return null;
    }

    let audioData: string;
    let mimeType: string;

    if (audioFile.type === 'base64') {
      audioData = audioFile.data;
      mimeType = audioFile.mimeType || 'audio/mp3';
    } else {
      this.logger.warn('Audio file ID not implemented yet');
      return null;
    }

    const result = await this.fileConversionClient.transcribeAudio(audioData, mimeType);
    if (result.success && result.text) {
      return result.text;
    }

    this.logger.error(`Audio transcription failed: ${result.error}`);
    return null;
  }

  private async processAttachments(attachmentIds: string[], projectId: string): Promise<void> {
    try {
      for (const attachmentId of attachmentIds) {
        await this.projectAttachmentService.findById(attachmentId);
      }
      this.logger.log(`Validated ${attachmentIds.length} attachments for project ${projectId}`);
    } catch (error) {
      this.logger.warn(`Attachment validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private setupSseHeaders(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
  }

  private async proxySseStream(streamUrl: string, res: Response): Promise<void> {
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
        this.sendError(res, `Stream error: ${error.message}`);
      });

      proxyReq.end();
    } catch (error) {
      this.sendError(res, error instanceof Error ? error.message : 'Failed to connect to AI service');
    }
  }

  private sendError(res: Response, message: string): void {
    res.write(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`);
    res.end();
  }
}
