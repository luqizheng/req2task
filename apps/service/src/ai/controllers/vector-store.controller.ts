import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from '../ai.service';
import { VectorStoreRequestDto } from '@req2task/dto';

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

@Controller('ai/vector-store')
@UseGuards(AuthGuard('jwt'))
export class VectorStoreController {
  constructor(private readonly aiService: AiService) {}

  @Get('search')
  async searchVectorStore(
    @Body('query') query: string,
    @Body('limit') limit?: number,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.aiService.searchVectorStore(query, limit || 5);
    return { code: 0, data: result };
  }

  @Post('add')
  async addToVectorStore(@Body() request: VectorStoreRequestDto): Promise<ApiResponse<null>> {
    await this.aiService.addToVectorStore(request.documents);
    return { code: 0, message: '添加成功' };
  }
}
