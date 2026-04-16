import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import {
  CreateLLMConfigDto,
  UpdateLLMConfigDto,
  ChatRequestDto,
  VectorStoreRequestDto,
} from '@req2task/dto';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly aiService: AiService) {}

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
}
