import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConflictDetectionService } from '../conflict-detection.service';
import { LLMMessage } from '@req2task/core';
import { ChatResponseDto } from '@req2task/dto';

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class ConflictDetectionController {
  constructor(private readonly conflictDetectionService: ConflictDetectionService) {}

  @Post('raw-requirements/:id/detect-conflicts')
  async detectConflicts(
    @Param('id') id: string,
    @Body('configId') configId?: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.conflictDetectionService.detectConflicts(id, configId);
    return { code: 0, data: result };
  }

  @Get('semantic-search')
  async semanticSearch(
    @Query('query') query: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.conflictDetectionService.semanticSearch(
      query,
      limit ? parseInt(limit, 10) : 10,
    );
    return { code: 0, data: result };
  }

  @Post('ai-chat')
  async aiChat(
    @Body('messages') messages: LLMMessage[],
    @Body('contextRequirementId') contextRequirementId?: string,
    @Body('configId') configId?: string,
  ): Promise<ApiResponse<ChatResponseDto>> {
    const result = await this.conflictDetectionService.chat(messages, contextRequirementId, configId);
    return { code: 0, data: result };
  }
}
