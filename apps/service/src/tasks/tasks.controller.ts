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
import { TasksService, MarkReplacedDto, MarkCancelledDto, WorkloadStats } from './tasks.service';
import { TaskKanbanService } from './task-kanban.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  AddDependencyDto,
  TaskResponseDto,
  TaskListResponseDto,
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
  constructor(
    private readonly tasksService: TasksService,
    private readonly taskKanbanService: TaskKanbanService,
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
  async getWorkloadStats(@Param('projectId') projectId: string): Promise<ApiResponse<WorkloadStats>> {
    const result = await this.tasksService.getWorkloadStats(projectId);
    return { code: 0, data: result };
  }
}
