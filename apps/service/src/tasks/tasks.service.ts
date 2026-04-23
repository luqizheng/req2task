import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository} from 'typeorm';
import { Task, Requirement, FeatureModule } from '@req2task/core';
import { TaskStatus, TaskPriority } from '@req2task/dto';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto, TaskListResponseDto, WorkloadStatsDto } from '@req2task/dto';

export interface MarkReplacedDto {
  replacedByTaskId: string;
  reason: string;
}

export interface MarkCancelledDto {
  reason: string;
  type: 'replaced' | 'wasted';
}

@Injectable()
export class TasksService {
  private taskCounter = 0;

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Requirement)
    private requirementRepository: Repository<Requirement>,
    @InjectRepository(FeatureModule)
    private featureModuleRepository: Repository<FeatureModule>,
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

  async findByModule(
    moduleId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<TaskListResponseDto> {
    const requirements = await this.requirementRepository.find({
      where: { moduleId },
      select: ['id'],
    });
    const requirementIds = requirements.map((r) => r.id);

    if (requirementIds.length === 0) {
      return { items: [], total: 0, page, limit };
    }

    const [items, total] = await this.taskRepository.findAndCount({
      where: requirementIds.map((id) => ({ requirementId: id })),
      relations: ['assignedTo', 'createdBy', 'dependencies', 'requirement'],
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

  async findByProject(
    projectId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<TaskListResponseDto> {
    const modules = await this.featureModuleRepository.find({
      where: { projectId },
      select: ['id'],
    });
    const moduleIds = modules.map((m) => m.id);

    if (moduleIds.length === 0) {
      return { items: [], total: 0, page, limit };
    }

    const requirements = await this.requirementRepository
      .createQueryBuilder('req')
      .where('req.moduleId IN (:...moduleIds)', { moduleIds })
      .select(['req.id'])
      .getMany();
    const requirementIds = requirements.map((r) => r.id);

    if (requirementIds.length === 0) {
      return { items: [], total: 0, page, limit };
    }

    const [items, total] = await this.taskRepository.findAndCount({
      where: requirementIds.map((id) => ({ requirementId: id })),
      relations: ['assignedTo', 'createdBy', 'dependencies', 'requirement'],
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
      relations: ['assignedTo', 'createdBy', 'dependencies', 'dependents', 'requirement', 'replacedByTask'],
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

  async markReplaced(taskId: string, dto: MarkReplacedDto): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignedTo', 'createdBy'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    if (task.status !== TaskStatus.DONE && task.status !== TaskStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress or done tasks can be marked as replaced');
    }

    const replacementTask = await this.taskRepository.findOne({
      where: { id: dto.replacedByTaskId },
    });

    if (!replacementTask) {
      throw new NotFoundException(`Replacement task with ID ${dto.replacedByTaskId} not found`);
    }

    task.status = TaskStatus.CANCELLED;
    task.cancelledReason = dto.reason;
    task.cancellationType = 'replaced';
    task.replacedByTaskId = dto.replacedByTaskId;

    const updated = await this.taskRepository.save(task);
    return this.toResponseDto(updated);
  }

  async markCancelled(taskId: string, dto: MarkCancelledDto): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['assignedTo', 'createdBy'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    task.status = TaskStatus.CANCELLED;
    task.cancelledReason = dto.reason;
    task.cancellationType = dto.type;

    const updated = await this.taskRepository.save(task);
    return this.toResponseDto(updated);
  }

  async getReplacedTasks(taskId: string): Promise<TaskResponseDto[]> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const replacedTasks = await this.taskRepository.find({
      where: { replacedByTaskId: taskId },
      relations: ['assignedTo', 'createdBy'],
    });

    return replacedTasks.map((t) => this.toResponseDto(t));
  }

  async getWorkloadStats(projectId: string): Promise<WorkloadStatsDto> {
    const modules = await this.featureModuleRepository.find({
      where: { projectId },
    });
    const moduleIds = modules.map((m) => m.id);

    if (moduleIds.length === 0) {
      return {
        projectId,
        effectiveHours: 0,
        reworkHours: 0,
        wastedHours: 0,
        totalHours: 0,
        taskCounts: { total: 0, completed: 0, cancelled: 0, replaced: 0 },
      };
    }

    const requirements = await this.requirementRepository.find({
      where: moduleIds.map((id) => ({ moduleId: id })),
    });
    const requirementIds = requirements.map((r) => r.id);

    const tasks = requirementIds.length > 0
      ? await this.taskRepository.find({
          where: requirementIds.map((id) => ({ requirementId: id })),
        })
      : [];

    let effectiveHours = 0;
    let reworkHours = 0;
    let wastedHours = 0;

    for (const task of tasks) {
      const hours = task.actualHours ? Number(task.actualHours) : 0;

      if (task.cancellationType === 'replaced') {
        reworkHours += hours;
      } else if (task.cancellationType === 'wasted') {
        wastedHours += hours;
      } else if (task.status === TaskStatus.DONE) {
        effectiveHours += hours;
      }
    }

    const totalHours = effectiveHours + reworkHours + wastedHours;

    return {
      projectId,
      effectiveHours: Math.round(effectiveHours * 100) / 100,
      reworkHours: Math.round(reworkHours * 100) / 100,
      wastedHours: Math.round(wastedHours * 100) / 100,
      totalHours: Math.round(totalHours * 100) / 100,
      taskCounts: {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === TaskStatus.DONE).length,
        cancelled: tasks.filter((t) => t.status === TaskStatus.CANCELLED).length,
        replaced: tasks.filter((t) => t.cancellationType === 'replaced').length,
      },
    };
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
