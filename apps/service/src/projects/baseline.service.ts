import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Baseline,
  Project,
  Requirement,
  Task,
  RequirementStatus,
  TaskStatus,
} from '@req2task/core';

@Injectable()
export class BaselineService {
  constructor(
    @InjectRepository(Baseline)
    private baselineRepository: Repository<Baseline>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Requirement)
    private requirementRepository: Repository<Requirement>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async createBaseline(
    projectId: string,
    name: string,
    description: string | null,
    createdById: string,
  ): Promise<Baseline> {
    const snapshotData = await this.takeSnapshot(projectId);

    const baseline = this.baselineRepository.create({
      projectId,
      name,
      description,
      snapshotData,
      createdById,
    });

    return this.baselineRepository.save(baseline);
  }

  async findByProject(projectId: string): Promise<Baseline[]> {
    return this.baselineRepository.find({
      where: { projectId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Baseline> {
    const baseline = await this.baselineRepository.findOne({
      where: { id },
      relations: ['project', 'createdBy'],
    });

    if (!baseline) {
      throw new NotFoundException('Baseline not found');
    }

    return baseline;
  }

  async restoreBaseline(baselineId: string): Promise<void> {
    const baseline = await this.findById(baselineId);
    await this.restoreSnapshot(baseline.snapshotData, baseline.projectId);
  }

  async deleteBaseline(id: string): Promise<void> {
    const baseline = await this.findById(id);
    await this.baselineRepository.remove(baseline);
  }

  private async takeSnapshot(projectId: string): Promise<Record<string, any>> {
    const requirements = await this.requirementRepository.find({
      where: { moduleId: projectId },
      relations: ['userStories', 'children'],
    });

    const tasks = await this.taskRepository.find({
      where: { requirementId: projectId },
    });

    return {
      requirements: requirements.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        priority: r.priority,
        storyPoints: r.storyPoints,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        estimatedHours: t.estimatedHours,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  private async restoreSnapshot(
    snapshot: Record<string, any>,
    projectId: string,
  ): Promise<void> {
    for (const reqSnapshot of snapshot.requirements || []) {
      await this.requirementRepository.update(reqSnapshot.id, {
        status: reqSnapshot.status,
        priority: reqSnapshot.priority,
      });
    }

    for (const taskSnapshot of snapshot.tasks || []) {
      await this.taskRepository.update(taskSnapshot.id, {
        status: taskSnapshot.status,
        priority: taskSnapshot.priority,
      });
    }
  }
}
