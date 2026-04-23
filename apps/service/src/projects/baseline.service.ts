import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Baseline, Project, Requirement, Task, FeatureModule } from '@req2task/core';

import {
  BaselineDto,
  BaselineComparisonDto,
  CreateBaselineDto as CreateBaselineInputDto,
  SnapshotDataDto,
} from '@req2task/dto';

@Injectable()
export class BaselineService {
  constructor(
    @InjectRepository(Baseline)
    private baselineRepository: Repository<Baseline>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(FeatureModule)
    private featureModuleRepository: Repository<FeatureModule>,
    @InjectRepository(Requirement)
    private requirementRepository: Repository<Requirement>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  private toSnapshotData(entity: Baseline): SnapshotDataDto {
    return entity.snapshotData as SnapshotDataDto;
  }

  private toBaselineDto(entity: Baseline): BaselineDto {
    return {
      id: entity.id,
      name: entity.name,
      projectId: entity.projectId,
      description: entity.description,
      createdBy: {
        id: entity.createdBy?.id ?? '',
        name: entity.createdBy?.displayName ?? '',
      },
      createdAt: entity.createdAt,
      snapshotData: this.toSnapshotData(entity),
    };
  }

  async createBaseline(
    projectId: string,
    dto: CreateBaselineInputDto,
    createdById: string,
  ): Promise<BaselineDto> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const snapshotData = await this.takeSnapshot(projectId);

    const baseline = this.baselineRepository.create({
      projectId,
      name: dto.name,
      description: dto.description || null,
      snapshotData,
      createdById,
    });

    const saved = await this.baselineRepository.save(baseline) as Baseline;
    return this.findById(saved.id);
  }

  async findByProject(projectId: string): Promise<BaselineDto[]> {
    const baselines = await this.baselineRepository.find({
      where: { projectId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });

    return baselines.map((b) => this.toBaselineDto(b));
  }

  async findById(id: string): Promise<BaselineDto> {
    const baseline = await this.baselineRepository.findOne({
      where: { id },
      relations: ['createdBy', 'project'],
    });

    if (!baseline) {
      throw new NotFoundException('Baseline not found');
    }

    return this.toBaselineDto(baseline);
  }

  async restoreBaseline(baselineId: string): Promise<void> {
    const baseline = await this.findById(baselineId);
    await this.restoreSnapshot(baseline.snapshotData);
  }

  async deleteBaseline(id: string): Promise<void> {
    const baseline = await this.baselineRepository.findOne({ where: { id } });
    if (!baseline) {
      throw new NotFoundException('Baseline not found');
    }
    await this.baselineRepository.remove(baseline);
  }

  async compareBaselines(baselineId1: string, baselineId2: string): Promise<BaselineComparisonDto> {
    const baseline1 = await this.findById(baselineId1);
    const baseline2 = await this.findById(baselineId2);

    const snapshot1 = baseline1.snapshotData;
    const snapshot2 = baseline2.snapshotData;

    const reqIds1 = new Set((snapshot1.requirements || []).map((r) => r.id));
    const reqIds2 = new Set((snapshot2.requirements || []).map((r) => r.id));

    const taskIds1 = new Set((snapshot1.tasks || []).map((t) => t.id));
    const taskIds2 = new Set((snapshot2.tasks || []).map((t) => t.id));

    const requirementsAdded: string[] = [];
    const requirementsRemoved: string[] = [];
    const requirementsChanged: Array<{
      id: string;
      title: string;
      changes: Record<string, { from: unknown; to: unknown }>;
    }> = [];

    const allReqIds = new Set([...reqIds1, ...reqIds2]);

    for (const reqId of allReqIds) {
      const req1 = snapshot1.requirements?.find((r) => r.id === reqId);
      const req2 = snapshot2.requirements?.find((r) => r.id === reqId);

      if (req1 && !req2) {
        requirementsRemoved.push(req1.title);
      } else if (!req1 && req2) {
        requirementsAdded.push(req2.title);
      } else if (req1 && req2) {
        const changes: Record<string, { from: unknown; to: unknown }> = {};
        if (req1.status !== req2.status) {
          changes.status = { from: req1.status, to: req2.status };
        }
        if (req1.priority !== req2.priority) {
          changes.priority = { from: req1.priority, to: req2.priority };
        }
        if (req1.storyPoints !== req2.storyPoints) {
          changes.storyPoints = { from: req1.storyPoints, to: req2.storyPoints };
        }
        if (Object.keys(changes).length > 0) {
          requirementsChanged.push({ id: reqId, title: req1.title, changes });
        }
      }
    }

    const tasksAdded: string[] = [];
    const tasksRemoved: string[] = [];
    const tasksChanged: Array<{
      id: string;
      title: string;
      changes: Record<string, { from: unknown; to: unknown }>;
    }> = [];

    const allTaskIds = new Set([...taskIds1, ...taskIds2]);

    for (const taskId of allTaskIds) {
      const task1 = snapshot1.tasks?.find((t) => t.id === taskId);
      const task2 = snapshot2.tasks?.find((t) => t.id === taskId);

      if (task1 && !task2) {
        tasksRemoved.push(task1.title);
      } else if (!task1 && task2) {
        tasksAdded.push(task2.title);
      } else if (task1 && task2) {
        const changes: Record<string, { from: unknown; to: unknown }> = {};
        if (task1.status !== task2.status) {
          changes.status = { from: task1.status, to: task2.status };
        }
        if (task1.priority !== task2.priority) {
          changes.priority = { from: task1.priority, to: task2.priority };
        }
        if (task1.estimatedHours !== task2.estimatedHours) {
          changes.estimatedHours = { from: task1.estimatedHours, to: task2.estimatedHours };
        }
        if (Object.keys(changes).length > 0) {
          tasksChanged.push({ id: taskId, title: task1.title, changes });
        }
      }
    }

    return {
      baseline1,
      baseline2,
      differences: {
        requirementsAdded,
        requirementsRemoved,
        requirementsChanged,
        tasksAdded,
        tasksRemoved,
        tasksChanged,
      },
    };
  }

  private async takeSnapshot(projectId: string): Promise<SnapshotDataDto> {
    const modules = await this.featureModuleRepository.find({ where: { projectId } });
    const moduleIds = modules.map((m) => m.id);

    const requirements = moduleIds.length > 0
      ? await this.requirementRepository.find({
          where: moduleIds.map((id) => ({ moduleId: id })),
        })
      : [];

    const requirementIds = requirements.map((r) => r.id);
    const tasks = requirementIds.length > 0
      ? await this.taskRepository.find({
          where: requirementIds.map((id) => ({ requirementId: id })),
        })
      : [];

    return {
      modules: modules.map((m) => ({
        id: m.id,
        name: m.name,
      })),
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

  private async restoreSnapshot(snapshot: SnapshotDataDto): Promise<void> {
    for (const reqSnapshot of snapshot.requirements || []) {
      await this.requirementRepository.update(reqSnapshot.id, {
        status: reqSnapshot.status,
        priority: reqSnapshot.priority as any,
      });
    }

    for (const taskSnapshot of snapshot.tasks || []) {
      await this.taskRepository.update(taskSnapshot.id, {
        status: taskSnapshot.status,
        priority: taskSnapshot.priority as any,
      });
    }
  }
}
