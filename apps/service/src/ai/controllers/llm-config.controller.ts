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
import { AiService } from '../ai.service';
import {
  CreateLLMConfigDto,
  UpdateLLMConfigDto,
  LLMConfigResponseDto,
} from '@req2task/dto';

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

@Controller('ai/llm-configs')
@UseGuards(AuthGuard('jwt'))
export class LlmConfigController {
  constructor(private readonly aiService: AiService) {}

  @Post()
  async createLLMConfig(
    @Body() createDto: CreateLLMConfigDto,
  ): Promise<ApiResponse<LLMConfigResponseDto>> {
    const result = await this.aiService.createLLMConfig(createDto);
    return { code: 0, data: result };
  }

  @Get()
  async findAllLLMConfigs(): Promise<ApiResponse<LLMConfigResponseDto[]>> {
    const result = await this.aiService.findAllLLMConfigs();
    return { code: 0, data: result };
  }

  @Get(':id')
  async findLLMConfig(
    @Param('id') id: string,
  ): Promise<ApiResponse<LLMConfigResponseDto>> {
    const result = await this.aiService.findLLMConfig(id);
    return { code: 0, data: result };
  }

  @Put(':id')
  async updateLLMConfig(
    @Param('id') id: string,
    @Body() updateDto: UpdateLLMConfigDto,
  ): Promise<ApiResponse<LLMConfigResponseDto>> {
    const result = await this.aiService.updateLLMConfig(id, updateDto);
    return { code: 0, data: result };
  }

  @Delete(':id')
  async deleteLLMConfig(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.aiService.deleteLLMConfig(id);
    return { code: 0, message: '删除成功' };
  }

  @Post(':id/test')
  async testLLMConfig(
    @Param('id') id: string,
    @Body('testMessage') testMessage?: string,
  ): Promise<
    ApiResponse<{
      success: boolean;
      content: string;
      configId: string;
      latencyMs?: number;
      error?: string;
    }>
  > {
    const result = await this.aiService.testLLMConfig(id, testMessage);
    return { code: 0, data: result };
  }
}
