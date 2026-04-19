import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Headers,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConversationService } from '@req2task/core';
import {
  CreateConversationDto,
  SendMessageDto,
  UpdateConversationDto,
  ConversationListQueryDto,
  ConversationMessagesQueryDto,
  ConversationDto,
  ConversationMessageDto,
  SendMessageResultDto,
} from '@req2task/dto';

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

@Controller('conversations')
@UseGuards(AuthGuard('jwt'))
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  async createConversation(
    @Body() dto: CreateConversationDto,
  ): Promise<ApiResponse<ConversationDto>> {
    const result = await this.conversationService.createConversation(dto);
    return { code: 0, data: result };
  }

  @Get()
  async getConversations(
    @Query() query: ConversationListQueryDto,
  ): Promise<ApiResponse<ConversationDto[]>> {
    const result = await this.conversationService.getConversations({
      collectionId: query.collectionId,
      rawRequirementId: query.rawRequirementId,
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });
    return { code: 0, data: result };
  }

  @Get(':id')
  async getConversation(
    @Param('id') id: string,
  ): Promise<ApiResponse<ConversationDto>> {
    const result = await this.conversationService.getConversation(id);
    if (!result) {
      return { code: 1, message: '会话不存在' };
    }
    return { code: 0, data: result };
  }

  @Patch(':id')
  async updateConversation(
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ): Promise<ApiResponse<ConversationDto>> {
    const result = await this.conversationService.updateConversation(id, dto);
    return { code: 0, data: result };
  }

  @Delete(':id')
  async deleteConversation(
    @Param('id') id: string,
  ): Promise<ApiResponse<null>> {
    await this.conversationService.deleteConversation(id);
    return { code: 0, message: '删除成功' };
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Headers('X-AI-Config-Id') configId?: string,
  ): Promise<ApiResponse<SendMessageResultDto>> {
    const result = await this.conversationService.sendMessage(
      id,
      dto.content,
      configId,
    );
    return {
      code: 0,
      data: {
        message: {
          id: result.message.id,
          conversationId: result.message.conversationId,
          role: result.message.role,
          content: result.message.content,
          rawRequirementId: result.message.rawRequirementId,
          metadata: result.message.metadata,
          createdAt: result.message.createdAt,
        },
        questionAndAnswers: result.followUpQuestions.map((q) => ({
          id: '',
          question: q.question,
          answer: null,
          createdAt: new Date().toISOString(),
          answeredAt: null,
        })),
        extractedRequirements: result.extractedRequirements,
        isComplete: result.isComplete,
      },
    };
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id') id: string,
    @Query() query: ConversationMessagesQueryDto,
  ): Promise<ApiResponse<ConversationMessageDto[]>> {
    const result = await this.conversationService.getMessages(
      id,
      query.limit || 100,
      query.offset || 0,
    );
    return {
      code: 0,
      data: result.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        rawRequirementId: m.rawRequirementId,
        metadata: m.metadata,
        createdAt: m.createdAt,
      })),
    };
  }
}
