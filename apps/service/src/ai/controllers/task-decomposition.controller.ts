import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskDecompositionService } from '../task-decomposition.service';

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class TaskDecompositionController {
  constructor(private readonly taskDecompositionService: TaskDecompositionService) {}

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
