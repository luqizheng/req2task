import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirementGenerationService } from '../requirement-generation.service';
import { AiService } from '../ai.service';
import {
  CreateRawRequirementDto,
  GenerateRequirementResultDto,
  PromptTemplateResponseDto,
  ChatResponseDto,
} from '@req2task/dto';

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
export class RequirementGenerationController {
  constructor(
    private readonly requirementGenerationService: RequirementGenerationService,
    private readonly aiService: AiService,
  ) {}

  @Post('chat')
  async chat(@Body() chatRequest: { message: string; configId?: string }): Promise<ApiResponse<ChatResponseDto>> {
    const result = await this.aiService.chat(chatRequest);
    return { code: 0, data: result };
  }

  @Post('generate-requirement')
  async generateRequirement(
    @Body('input') input: string,
    @Body('configId') configId?: string,
    @Request() req?: AuthenticatedRequest,
  ): Promise<ApiResponse<GenerateRequirementResultDto>> {
    const userId = req?.user?.id || req?.user?.username || 'anonymous';
    const rawRequirement = await this.requirementGenerationService.createRawRequirement(input, userId);
    const result = await this.requirementGenerationService.generateRequirement(rawRequirement.id, configId);
    return { code: 0, data: result };
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
  ): Promise<ApiResponse<GenerateRequirementResultDto>> {
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
}
