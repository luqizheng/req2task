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
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { TasksService, MarkReplacedDto, MarkCancelledDto } from './tasks.service';
import { TaskKanbanService } from './task-kanban.service';
import { AiGenerationService } from '../ai/ai-generation.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  AddDependencyDto,
  TaskResponseDto,
  TaskListResponseDto,
  WorkloadStatsDto,
  GenerateTasksDto,
} from '@req2task/dto';
import { TaskStatus } from '@req2task/dto';

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

@Controller()
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  private readonly logger = new Logger(TasksController.name);

  constructor(
    private readonly tasksService: TasksService,
    private readonly taskKanbanService: TaskKanbanService,
    private readonly aiGenerationService: AiGenerationService,
  ) {}

  @Post('requirements/:requirementId/tasks')
  async create(
    @Param('requirementId') requirementId: string,
    @Body() createDto: CreateTaskDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<TaskResponseDto>> {
    const user = req.user as { id?: string; userId?: string };
    const userId = user.id || user.userId;
    const result = await this.tasksService.create(
      requirementId,
      createDto,
      userId!,
    );
    return { code: 0, data: result };
  }

  @Post('requirements/:requirementId/ai-generate-tasks')
  @HttpCode(HttpStatus.OK)
  async generateTasks(
    @Param('requirementId') requirementId: string,
    @Body() dto: GenerateTasksDto,
    @Query('projectId') projectId: string,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const user = req.user as { id?: string; userId?: string };
    const createdById = user?.id || 'system';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const stream$ = this.aiGenerationService.streamGenerateTasks(
      requirementId,
      dto.featurePoints,
      projectId,
      createdById,
      dto.context,
    );

    stream$.subscribe({
      next: (chunk) => {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      },
      error: (error: Error) => {
        this.logger.error({ error }, 'SSE stream error');
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
      },
      complete: () => {
        res.write('data: [DONE]\n\n');
        res.end();
      },
    });
  }

  @Get('requirements/:requirementId/tasks')
  async findByRequirement(
    @Param('requirementId') requirementId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<TaskListResponseDto>> {
    const result = await this.tasksService.findByRequirement(
      requirementId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { code: 0, data: result };
  }

  @Get('modules/:moduleId/tasks')
  async findByModule(
    @Param('moduleId') moduleId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<TaskListResponseDto>> {
    const result = await this.tasksService.findByModule(
      moduleId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { code: 0, data: result };
  }

  @Get('projects/:projectId/tasks')
  async findByProject(
    @Param('projectId') projectId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<TaskListResponseDto>> {
    const result = await this.tasksService.findByProject(
      projectId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { code: 0, data: result };
  }

  @Get('requirements/:requirementId/kanban')
  async getKanbanBoard(@Param('requirementId') requirementId: string): Promise<ApiResponse<unknown>> {
    const result = await this.taskKanbanService.getKanbanBoard(requirementId);
    return { code: 0, data: result };
  }

  @Get('requirements/:requirementId/task-statistics')
  async getTaskStatistics(@Param('requirementId') requirementId: string): Promise<ApiResponse<unknown>> {
    const result = await this.taskKanbanService.getTaskStatistics(requirementId);
    return { code: 0, data: result };
  }

  @Get('projects/:projectId/kanban')
  async getProjectKanbanBoard(@Param('projectId') projectId: string): Promise<ApiResponse<unknown>> {
    const result = await this.taskKanbanService.getProjectKanbanBoard(projectId);
    return { code: 0, data: result };
  }

  @Get('projects/:projectId/task-statistics')
  async getProjectTaskStatistics(@Param('projectId') projectId: string): Promise<ApiResponse<unknown>> {
    const result = await this.taskKanbanService.getProjectTaskStatistics(projectId);
    return { code: 0, data: result };
  }

  @Get('tasks/:id')
  async findById(@Param('id') id: string): Promise<ApiResponse<TaskResponseDto>> {
    const result = await this.tasksService.findById(id);
    return { code: 0, data: result };
  }

  @Put('tasks/:id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTaskDto,
  ): Promise<ApiResponse<TaskResponseDto>> {
    const result = await this.tasksService.update(id, updateDto);
    return { code: 0, data: result };
  }

  @Post('tasks/:id/transition')
  async transitionStatus(
    @Param('id') id: string,
    @Body('targetStatus') targetStatus: TaskStatus,
  ): Promise<ApiResponse<TaskResponseDto>> {
    const result = await this.taskKanbanService.transitionStatus(id, targetStatus);
    return { code: 0, data: result };
  }

  @Get('tasks/:id/allowed-transitions')
  async getAllowedTransitions(@Param('id') id: string): Promise<ApiResponse<{ allowedTransitions: string[] }>> {
    const task = await this.tasksService.findById(id);
    const allowedTransitions = await this.taskKanbanService.getAllowedTransitions(task.status);
    return { code: 0, data: { allowedTransitions } };
  }

  @Delete('tasks/:id')
  async delete(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.tasksService.delete(id);
    return { code: 0, message: '删除成功' };
  }

  @Post('tasks/:id/dependencies')
  async addDependency(
    @Param('id') id: string,
    @Body() addDependencyDto: AddDependencyDto,
  ): Promise<ApiResponse<TaskResponseDto>> {
    const result = await this.tasksService.addDependency(
      id,
      addDependencyDto.dependencyTaskId,
    );
    return { code: 0, data: result };
  }

  @Delete('tasks/:id/dependencies/:dependencyTaskId')
  async removeDependency(
    @Param('id') id: string,
    @Param('dependencyTaskId') dependencyTaskId: string,
  ): Promise<ApiResponse<TaskResponseDto>> {
    const result = await this.tasksService.removeDependency(id, dependencyTaskId);
    return { code: 0, data: result };
  }

  @Post('tasks/:id/mark-replaced')
  async markReplaced(
    @Param('id') id: string,
    @Body() dto: MarkReplacedDto,
  ): Promise<ApiResponse<TaskResponseDto>> {
    const result = await this.tasksService.markReplaced(id, dto);
    return { code: 0, data: result };
  }

  @Post('tasks/:id/mark-cancelled')
  async markCancelled(
    @Param('id') id: string,
    @Body() dto: MarkCancelledDto,
  ): Promise<ApiResponse<TaskResponseDto>> {
    const result = await this.tasksService.markCancelled(id, dto);
    return { code: 0, data: result };
  }

  @Get('tasks/:id/replaced-tasks')
  async getReplacedTasks(@Param('id') id: string): Promise<ApiResponse<TaskResponseDto[]>> {
    const result = await this.tasksService.getReplacedTasks(id);
    return { code: 0, data: result };
  }

  @Get('projects/:projectId/workload-stats')
  async getWorkloadStats(@Param('projectId') projectId: string): Promise<ApiResponse<WorkloadStatsDto>> {
    const result = await this.tasksService.getWorkloadStats(projectId);
    return { code: 0, data: result };
  }
}
