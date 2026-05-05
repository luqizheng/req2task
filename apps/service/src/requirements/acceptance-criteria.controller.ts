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
import { AcceptanceCriteriaService } from './acceptance-criteria.service';
import {
  CreateAcceptanceCriteriaDto,
  UpdateAcceptanceCriteriaDto,
  AcceptanceCriteriaResponseDto,
} from '@req2task/dto';
import { ApiResponse } from '../common';

@Controller('acceptance-criteria')
@UseGuards(AuthGuard('jwt'))
export class AcceptanceCriteriaController {
  constructor(private readonly acceptanceCriteriaService: AcceptanceCriteriaService) {}

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
}
