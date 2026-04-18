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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { RequirementGenerationService } from './requirement-generation.service';
import { ConflictDetectionService } from './conflict-detection.service';
import { TaskDecompositionService } from './task-decomposition.service';
import {
  CreateLLMConfigDto,
  UpdateLLMConfigDto,
  ChatRequestDto,
  VectorStoreRequestDto,
  CreateRawRequirementDto,
  LLMConfigResponseDto,
  ChatResponseDto,
  PromptTemplateResponseDto,
  GenerateRequirementResponseDto,
} from '@req2task/dto';
import { LLMMessage } from '@req2task/core';

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

interface AuthenticatedRequest {
  user: {
    id: string;
    username: string;
  };
}

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly requirementGenerationService: RequirementGenerationService,
    private readonly conflictDetectionService: ConflictDetectionService,
    private readonly taskDecompositionService: TaskDecompositionService,
  ) {}

  @Post('llm-configs')
  async createLLMConfig(@Body() createDto: CreateLLMConfigDto): Promise<ApiResponse<LLMConfigResponseDto>> {
    const result = await this.aiService.createLLMConfig(createDto);
    return { code: 0, data: result };
  }

  @Get('llm-configs')
  async findAllLLMConfigs(): Promise<ApiResponse<LLMConfigResponseDto[]>> {
    const result = await this.aiService.findAllLLMConfigs();
    return { code: 0, data: result };
  }

  @Get('llm-configs/:id')
  async findLLMConfig(@Param('id') id: string): Promise<ApiResponse<LLMConfigResponseDto>> {
    const result = await this.aiService.findLLMConfig(id);
    return { code: 0, data: result };
  }

  @Put('llm-configs/:id')
  async updateLLMConfig(
    @Param('id') id: string,
    @Body() updateDto: UpdateLLMConfigDto,
  ): Promise<ApiResponse<LLMConfigResponseDto>> {
    const result = await this.aiService.updateLLMConfig(id, updateDto);
    return { code: 0, data: result };
  }

  @Delete('llm-configs/:id')
  async deleteLLMConfig(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.aiService.deleteLLMConfig(id);
    return { code: 0, message: '删除成功' };
  }

  @Post('llm-configs/:id/test')
  async testLLMConfig(
    @Param('id') id: string,
    @Body('testMessage') testMessage?: string,
  ): Promise<ApiResponse<{
    success: boolean;
    content: string;
    configId: string;
    latencyMs?: number;
    error?: string;
  }>> {
    const result = await this.aiService.testLLMConfig(id, testMessage);
    return { code: 0, data: result };
  }

  @Post('chat')
  async chat(@Body() chatRequest: ChatRequestDto): Promise<ApiResponse<ChatResponseDto>> {
    const result = await this.aiService.chat(chatRequest);
    return { code: 0, data: result };
  }

  @Post('generate-requirement')
  async generateRequirement(
    @Body('input') input: string,
    @Body('configId') configId?: string,
    @Request() req?: AuthenticatedRequest,
  ): Promise<ApiResponse<GenerateRequirementResponseDto>> {
    const userId = req?.user?.id || req?.user?.username || 'anonymous';
    const rawRequirement = await this.requirementGenerationService.createRawRequirement(
      input,
      userId,
    );
    const result = await this.requirementGenerationService.generateRequirement(
      rawRequirement.id,
      configId,
    );
    return { code: 0, data: result };
  }

  @Get('vector-store/search')
  async searchVectorStore(
    @Body('query') query: string,
    @Body('limit') limit?: number,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.aiService.searchVectorStore(query, limit || 5);
    return { code: 0, data: result };
  }

  @Post('vector-store/add')
  async addToVectorStore(@Body() request: VectorStoreRequestDto): Promise<ApiResponse<null>> {
    await this.aiService.addToVectorStore(request.documents);
    return { code: 0, message: '添加成功' };
  }

  @Get('prompt-templates')
  async getPromptTemplates(): Promise<ApiResponse<PromptTemplateResponseDto[]>> {
    const result = await this.aiService.getPromptTemplates();
    return { code: 0, data: result };
  }

  @Post('raw-requirements')
  async createRawRequirement(
    @Body() createDto: CreateRawRequirementDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<unknown>> {
    const userId = req.user.id;
    const result = await this.requirementGenerationService.createRawRequirement(
      createDto.content,
      userId!,
    );
    return { code: 0, data: result };
  }

  @Get('raw-requirements')
  async findRawRequirements(): Promise<ApiResponse<unknown[]>> {
    const result = await this.requirementGenerationService.findAll();
    return { code: 0, data: result };
  }

  @Post('raw-requirements/:id/generate')
  async generateFromRaw(
    @Param('id') id: string,
    @Body('configId') configId?: string,
  ): Promise<ApiResponse<GenerateRequirementResponseDto>> {
    const result = await this.requirementGenerationService.generateRequirement(id, configId);
    return { code: 0, data: result };
  }

  @Post('generate-user-stories')
  async generateUserStories(
    @Body('requirementContent') requirementContent: string,
    @Body('configId') configId?: string,
  ): Promise<ApiResponse<{ role: string; goal: string; benefit: string }[]>> {
    const result = await this.requirementGenerationService.generateUserStories(
      requirementContent,
      configId,
    );
    return { code: 0, data: result };
  }

  @Post('generate-acceptance-criteria')
  async generateAcceptanceCriteria(
    @Body('requirementContent') requirementContent: string,
    @Body('configId') configId?: string,
  ): Promise<ApiResponse<string[]>> {
    const result = await this.requirementGenerationService.generateAcceptanceCriteria(
      requirementContent,
      configId,
    );
    return { code: 0, data: result };
  }

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
    const result = await this.conflictDetectionService.chat(
      messages,
      contextRequirementId,
      configId,
    );
    return { code: 0, data: result };
  }

  @Post('decompose-requirement')
  async decomposeRequirement(
    @Body('requirementContent') requirementContent: string,
    @Body('configId') configId?: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.taskDecompositionService.decomposeRequirement(
      requirementContent,
      configId,
    );
    return { code: 0, data: result };
  }

  @Post('estimate-workload')
  async estimateWorkload(
    @Body('requirementContent') requirementContent: string,
    @Body('configId') configId?: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.taskDecompositionService.estimateWorkload(
      requirementContent,
      configId,
    );
    return { code: 0, data: result };
  }

  @Get('similar-requirements')
  async findSimilarRequirements(
    @Query('requirementContent') requirementContent: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.taskDecompositionService.findSimilarRequirements(
      requirementContent,
      limit ? parseInt(limit, 10) : 5,
    );
    return { code: 0, data: result };
  }

  @Post('tasks/:id/generate-subtasks')
  async generateSubTasks(
    @Param('id') id: string,
    @Body('configId') configId?: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.taskDecompositionService.generateSubTasks(id, configId);
    return { code: 0, data: result };
  }
}
