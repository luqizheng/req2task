import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, Requirement, RequirementStatus } from '@req2task/core';

const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.IN_REVIEW, TaskStatus.BLOCKED, TaskStatus.TODO],
  [TaskStatus.IN_REVIEW]: [TaskStatus.DONE, TaskStatus.IN_PROGRESS],
  [TaskStatus.DONE]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.BLOCKED]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
};

@Injectable()
export class TaskKanbanService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Requirement)
    private requirementRepository: Repository<Requirement>,
  ) {}

  async canTransition(currentStatus: TaskStatus, targetStatus: TaskStatus): Promise<boolean> {
    if (currentStatus === targetStatus) return true;
    const allowedTransitions = TASK_STATUS_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(targetStatus);
  }

  async transitionStatus(
    taskId: string,
    targetStatus: TaskStatus,
    _userId?: string,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });

    if (!task) {
      throw new BadRequestException(`Task with ID ${taskId} not found`);
    }

    const currentStatus = task.status;
    const canTransition = await this.canTransition(currentStatus, targetStatus);

    if (!canTransition) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${targetStatus}`,
      );
    }

    task.status = targetStatus;
    const updated = await this.taskRepository.save(task);

    if (targetStatus === TaskStatus.DONE) {
      await this.checkRequirementCompletion(task.requirementId);
    }

    return updated;
  }

  async getAllowedTransitions(currentStatus: TaskStatus): Promise<TaskStatus[]> {
    return TASK_STATUS_TRANSITIONS[currentStatus] || [];
  }

  async getKanbanBoard(
    requirementId: string,
  ): Promise<Record<TaskStatus, Task[]>> {
    const tasks = await this.taskRepository.find({
      where: { requirementId },
      relations: ['assignedTo', 'createdBy'],
      order: { createdAt: 'ASC' },
    });

    const kanban: Record<TaskStatus, Task[]> = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.IN_REVIEW]: [],
      [TaskStatus.DONE]: [],
      [TaskStatus.BLOCKED]: [],
    };

    for (const task of tasks) {
      kanban[task.status].push(task);
    }

    return kanban;
  }

  async getTaskStatistics(requirementId: string): Promise<{
    total: number;
    byStatus: Record<TaskStatus, number>;
    byPriority: Record<string, number>;
    completedPercentage: number;
    estimatedHours: number;
    actualHours: number;
  }> {
    const tasks = await this.taskRepository.find({ where: { requirementId } });

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let estimatedHours = 0;
    let actualHours = 0;

    for (const task of tasks) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;

      if (task.estimatedHours) estimatedHours += Number(task.estimatedHours);
      if (task.actualHours) actualHours += Number(task.actualHours);
    }

    const completedCount = byStatus[TaskStatus.DONE] || 0;
    const completedPercentage = tasks.length > 0
      ? Math.round((completedCount / tasks.length) * 100)
      : 0;

    return {
      total: tasks.length,
      byStatus: byStatus as Record<TaskStatus, number>,
      byPriority,
      completedPercentage,
      estimatedHours,
      actualHours,
    };
  }

  private async checkRequirementCompletion(requirementId: string): Promise<void> {
    const tasks = await this.taskRepository.find({ where: { requirementId } });

    const allCompleted = tasks.length > 0 && tasks.every(
      (t) => t.status === TaskStatus.DONE,
    );

    if (allCompleted) {
      await this.requirementRepository.update(requirementId, {
        status: RequirementStatus.PROCESSING,
      });
    }
  }
}
