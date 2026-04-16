import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { RequirementGenerationService } from './requirement-generation.service';
import {
  CreateLLMConfigDto,
  UpdateLLMConfigDto,
  ChatRequestDto,
  VectorStoreRequestDto,
  CreateRawRequirementDto,
} from '@req2task/dto';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly requirementGenerationService: RequirementGenerationService,
  ) {}

  @Post('llm-configs')
  async createLLMConfig(@Body() createDto: CreateLLMConfigDto) {
    const result = await this.aiService.createLLMConfig(createDto);
    return { code: 0, data: result };
  }

  @Get('llm-configs')
  async findAllLLMConfigs() {
    const result = await this.aiService.findAllLLMConfigs();
    return { code: 0, data: result };
  }

  @Get('llm-configs/:id')
  async findLLMConfig(@Param('id') id: string) {
    const result = await this.aiService.findLLMConfig(id);
    return { code: 0, data: result };
  }

  @Put('llm-configs/:id')
  async updateLLMConfig(
    @Param('id') id: string,
    @Body() updateDto: UpdateLLMConfigDto,
  ) {
    const result = await this.aiService.updateLLMConfig(id, updateDto);
    return { code: 0, data: result };
  }

  @Delete('llm-configs/:id')
  async deleteLLMConfig(@Param('id') id: string) {
    await this.aiService.deleteLLMConfig(id);
    return { code: 0, message: '删除成功' };
  }

  @Post('chat')
  async chat(@Body() chatRequest: ChatRequestDto) {
    const result = await this.aiService.chat(chatRequest);
    return { code: 0, data: result };
  }

  @Post('generate-requirement')
  async generateRequirement(
    @Body('input') input: string,
    @Body('configId') configId?: string,
  ) {
    const result = await this.aiService.generateRequirement(input, configId);
    return { code: 0, data: result };
  }

  @Get('vector-store/search')
  async searchVectorStore(
    @Body('query') query: string,
    @Body('limit') limit?: number,
  ) {
    const result = await this.aiService.searchVectorStore(query, limit || 5);
    return { code: 0, data: result };
  }

  @Post('vector-store/add')
  async addToVectorStore(@Body() request: VectorStoreRequestDto) {
    await this.aiService.addToVectorStore(request.documents);
    return { code: 0, message: '添加成功' };
  }

  @Get('prompt-templates')
  async getPromptTemplates() {
    const result = await this.aiService.getPromptTemplates();
    return { code: 0, data: result };
  }

  @Post('modules/:moduleId/raw-requirements')
  async createRawRequirement(
    @Param('moduleId') moduleId: string,
    @Body() createDto: CreateRawRequirementDto,
    @Request() req: any,
  ) {
    const result = await this.requirementGenerationService.createRawRequirement(
      moduleId,
      createDto.content,
      req.user.userId,
    );
    return { code: 0, data: result };
  }

  @Get('modules/:moduleId/raw-requirements')
  async findRawRequirements(@Param('moduleId') moduleId: string) {
    const result = await this.requirementGenerationService.findByModule(moduleId);
    return { code: 0, data: result };
  }

  @Post('raw-requirements/:id/generate')
  async generateFromRaw(
    @Param('id') id: string,
    @Body('configId') configId?: string,
  ) {
    const result = await this.requirementGenerationService.generateRequirement(id, configId);
    return { code: 0, data: result };
  }

  @Post('generate-user-stories')
  async generateUserStories(
    @Body('requirementContent') requirementContent: string,
    @Body('configId') configId?: string,
  ) {
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
  ) {
    const result = await this.requirementGenerationService.generateAcceptanceCriteria(
      requirementContent,
      configId,
    );
    return { code: 0, data: result };
  }
}
