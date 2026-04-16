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
import { TasksService } from './tasks.service';
import { TaskKanbanService } from './task-kanban.service';
import { CreateTaskDto, UpdateTaskDto, AddDependencyDto } from '@req2task/dto';
import { TaskStatus } from '@req2task/core';

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
    @Request() req: any,
  ) {
    const result = await this.tasksService.create(
      requirementId,
      createDto,
      req.user.userId,
    );
    return { code: 0, data: result };
  }

  @Get('requirements/:requirementId/tasks')
  async findByRequirement(
    @Param('requirementId') requirementId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.tasksService.findByRequirement(
      requirementId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { code: 0, data: result };
  }

  @Get('requirements/:requirementId/kanban')
  async getKanbanBoard(@Param('requirementId') requirementId: string) {
    const result = await this.taskKanbanService.getKanbanBoard(requirementId);
    return { code: 0, data: result };
  }

  @Get('requirements/:requirementId/task-statistics')
  async getTaskStatistics(@Param('requirementId') requirementId: string) {
    const result = await this.taskKanbanService.getTaskStatistics(requirementId);
    return { code: 0, data: result };
  }

  @Get('tasks/:id')
  async findById(@Param('id') id: string) {
    const result = await this.tasksService.findById(id);
    return { code: 0, data: result };
  }

  @Put('tasks/:id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTaskDto,
  ) {
    const result = await this.tasksService.update(id, updateDto);
    return { code: 0, data: result };
  }

  @Post('tasks/:id/transition')
  async transitionStatus(
    @Param('id') id: string,
    @Body('targetStatus') targetStatus: TaskStatus,
  ) {
    const result = await this.taskKanbanService.transitionStatus(id, targetStatus);
    return { code: 0, data: result };
  }

  @Get('tasks/:id/allowed-transitions')
  async getAllowedTransitions(@Param('id') id: string) {
    const task = await this.tasksService.findById(id);
    const allowedTransitions = await this.taskKanbanService.getAllowedTransitions(task.status);
    return { code: 0, data: { allowedTransitions } };
  }

  @Delete('tasks/:id')
  async delete(@Param('id') id: string) {
    await this.tasksService.delete(id);
    return { code: 0, message: '删除成功' };
  }

  @Post('tasks/:id/dependencies')
  async addDependency(
    @Param('id') id: string,
    @Body() addDependencyDto: AddDependencyDto,
  ) {
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
  ) {
    const result = await this.tasksService.removeDependency(id, dependencyTaskId);
    return { code: 0, data: result };
  }
}
