import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '@req2task/core';
import { TaskStatus, TaskPriority } from '@req2task/dto';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto, TaskListResponseDto } from '@req2task/dto';

@Injectable()
export class TasksService {
  private taskCounter = 0;

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  private generateTaskNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    this.taskCounter++;
    return `TASK-${year}${month}${day}-${String(this.taskCounter).padStart(4, '0')}`;
  }

  async create(
    requirementId: string,
    createDto: CreateTaskDto,
    createdById: string,
  ): Promise<TaskResponseDto> {
    const task = this.taskRepository.create({
      requirementId,
      title: createDto.title,
      description: createDto.description || null,
      priority: createDto.priority || TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      taskNo: this.generateTaskNo(),
      assignedToId: createDto.assignedToId || null,
      estimatedHours: createDto.estimatedHours || null,
      dueDate: createDto.dueDate ? new Date(createDto.dueDate) : null,
      parentTaskId: createDto.parentTaskId || null,
      createdById,
    });

    const saved = await this.taskRepository.save(task);
    return this.toResponseDto(saved);
  }

  async findByRequirement(
    requirementId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<TaskListResponseDto> {
    const [items, total] = await this.taskRepository.findAndCount({
      where: { requirementId },
      relations: ['assignedTo', 'createdBy', 'dependencies'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items: items.map((t) => this.toResponseDto(t)),
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignedTo', 'createdBy', 'dependencies', 'dependents', 'requirement'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return this.toResponseDto(task);
  }

  async update(id: string, updateDto: UpdateTaskDto): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignedTo', 'createdBy', 'dependencies'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (updateDto.title !== undefined) task.title = updateDto.title;
    if (updateDto.description !== undefined) task.description = updateDto.description;
    if (updateDto.status !== undefined) task.status = updateDto.status;
    if (updateDto.priority !== undefined) task.priority = updateDto.priority;
    if (updateDto.assignedToId !== undefined) task.assignedToId = updateDto.assignedToId || null;
    if (updateDto.estimatedHours !== undefined) task.estimatedHours = updateDto.estimatedHours;
    if (updateDto.actualHours !== undefined) task.actualHours = updateDto.actualHours;
    if (updateDto.dueDate !== undefined) task.dueDate = updateDto.dueDate ? new Date(updateDto.dueDate) : null;

    const updated = await this.taskRepository.save(task);
    return this.toResponseDto(updated);
  }

  async delete(id: string): Promise<void> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    await this.taskRepository.remove(task);
  }

  async addDependency(taskId: string, dependencyTaskId: string): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['dependencies'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const dependency = await this.taskRepository.findOne({
      where: { id: dependencyTaskId },
    });

    if (!dependency) {
      throw new NotFoundException(`Dependency task with ID ${dependencyTaskId} not found`);
    }

    if (taskId === dependencyTaskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }

    const alreadyExists = task.dependencies.some((d) => d.id === dependencyTaskId);
    if (alreadyExists) {
      throw new BadRequestException('Dependency already exists');
    }

    task.dependencies.push(dependency);
    const updated = await this.taskRepository.save(task);
    return this.toResponseDto(updated);
  }

  async removeDependency(taskId: string, dependencyTaskId: string): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['dependencies'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    task.dependencies = task.dependencies.filter((d) => d.id !== dependencyTaskId);
    const updated = await this.taskRepository.save(task);
    return this.toResponseDto(updated);
  }

  private toResponseDto(task: Task): TaskResponseDto {
    const dto: TaskResponseDto = {
      id: task.id,
      taskNo: task.taskNo,
      title: task.title,
      description: task.description,
      requirementId: task.requirementId,
      status: task.status,
      priority: task.priority,
      assignedToId: task.assignedToId,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      dueDate: task.dueDate,
      parentTaskId: task.parentTaskId,
      createdById: task.createdById,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

    if (task.assignedTo) {
      dto.assignedTo = {
        id: task.assignedTo.id,
        displayName: task.assignedTo.displayName,
        username: task.assignedTo.username,
      };
    }

    if (task.createdBy) {
      dto.createdBy = {
        id: task.createdBy.id,
        displayName: task.createdBy.displayName,
        username: task.createdBy.username,
      };
    }

    return dto;
  }
}
