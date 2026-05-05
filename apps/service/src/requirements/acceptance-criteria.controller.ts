import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AcceptanceCriteriaService } from './acceptance-criteria.service';
import { AiGenerationService } from '../ai/ai-generation.service';
import {
  CreateAcceptanceCriteriaDto,
  UpdateAcceptanceCriteriaDto,
  AcceptanceCriteriaResponseDto,
  GenerateAcceptanceCriteriaDto,
} from '@req2task/dto';
import { ApiResponse } from '../common';

@Controller('acceptance-criteria')
@UseGuards(AuthGuard('jwt'))
export class AcceptanceCriteriaController {
  constructor(
    private readonly acceptanceCriteriaService: AcceptanceCriteriaService,
    private readonly aiGenerationService: AiGenerationService,
  ) {}

  @Post('user-stories/:userStoryId/acceptance-criteria')
  async create(
    @Param('userStoryId') userStoryId: string,
    @Body() createDto: CreateAcceptanceCriteriaDto,
  ): Promise<ApiResponse<AcceptanceCriteriaResponseDto>> {
    const result = await this.acceptanceCriteriaService.create(userStoryId, createDto);
    return { code: 0, data: result };
  }

  @Get('user-stories/:userStoryId/acceptance-criteria')
  async findByUserStory(
    @Param('userStoryId') userStoryId: string,
  ): Promise<ApiResponse<AcceptanceCriteriaResponseDto[]>> {
    const result = await this.acceptanceCriteriaService.findByUserStory(userStoryId);
    return { code: 0, data: result };
  }

  @Put('acceptance-criteria/:id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAcceptanceCriteriaDto,
  ): Promise<ApiResponse<AcceptanceCriteriaResponseDto>> {
    const result = await this.acceptanceCriteriaService.update(id, updateDto);
    return { code: 0, data: result };
  }

  @Delete('acceptance-criteria/:id')
  async delete(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.acceptanceCriteriaService.delete(id);
    return { code: 0, message: '删除成功' };
  }

  @Post('user-stories/:userStoryId/ai-generate-acceptance-criteria')
  @HttpCode(HttpStatus.CREATED)
  async generateAcceptanceCriteria(
    @Param('userStoryId') userStoryId: string,
    @Body() dto: GenerateAcceptanceCriteriaDto,
  ) {
    const result = await this.aiGenerationService.generateAcceptanceCriteria(
      userStoryId,
      dto.context,
    );

    return {
      code: 0,
      data: {
        acceptanceCriteria: result.acceptanceCriteria.map((ac) => ({
          id: ac.id,
          userStoryId: ac.userStoryId,
          criteriaType: ac.criteriaType,
          content: ac.content,
          testMethod: ac.testMethod,
          createdAt: ac.createdAt,
        })),
        rawContent: result.rawContent,
      },
    };
  }
}
