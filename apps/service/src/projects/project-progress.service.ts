import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Project,
  Requirement,
  RequirementStatus,
  Task,
  TaskStatus,
  FeatureModule,
} from '@req2task/core';

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  totalModules: number;
  totalRequirements: number;
  completedRequirements: number;
  requirementProgress: number;
  totalTasks: number;
  completedTasks: number;
  taskProgress: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  byRequirementStatus: Record<string, number>;
  byTaskStatus: Record<string, number>;
  burndownData: BurndownPoint[];
}

export interface BurndownPoint {
  date: string;
  planned: number;
  actual: number;
}

export interface ModuleProgress {
  moduleId: string;
  moduleName: string;
  totalRequirements: number;
  completedRequirements: number;
  progress: number;
  requirements: {
    id: string;
    title: string;
    status: RequirementStatus;
    taskCount: number;
    completedTaskCount: number;
  }[];
}

@Injectable()
export class ProjectProgressService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Requirement)
    private requirementRepository: Repository<Requirement>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(FeatureModule)
    private featureModuleRepository: Repository<FeatureModule>,
  ) {}

  async getProjectProgress(projectId: string): Promise<ProjectProgress> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });

    if (!project) {
      throw new Error('Project not found');
    }

    const modules = await this.featureModuleRepository.find({ where: { projectId } });
    const moduleIds = modules.map((m) => m.id);

    const requirements = await this.requirementRepository.find({
      where: moduleIds.map((id) => ({ moduleId: id })),
    });

    const requirementIds = requirements.map((r) => r.id);
    const tasks = requirementIds.length > 0
      ? await this.taskRepository.find({ where: requirementIds.map((id) => ({ requirementId: id })) })
      : [];

    const completedRequirements = requirements.filter(
      (r) => r.status === RequirementStatus.COMPLETED,
    );

    const completedTasks = tasks.filter((t) => t.status === TaskStatus.DONE).length;

    const totalStoryPoints = requirements.reduce((sum, r) => sum + r.storyPoints, 0);
    const completedStoryPoints = completedRequirements.reduce(
      (sum, r) => sum + r.storyPoints,
      0,
    );

    const totalEstimatedHours = tasks.reduce(
      (sum, t) => sum + (t.estimatedHours ? Number(t.estimatedHours) : 0),
      0,
    );
    const totalActualHours = tasks.reduce(
      (sum, t) => sum + (t.actualHours ? Number(t.actualHours) : 0),
      0,
    );

    const byRequirementStatus: Record<string, number> = {};
    const byTaskStatus: Record<string, number> = {};

    for (const r of requirements) {
      byRequirementStatus[r.status] = (byRequirementStatus[r.status] || 0) + 1;
    }

    for (const t of tasks) {
      byTaskStatus[t.status] = (byTaskStatus[t.status] || 0) + 1;
    }

    const requirementProgress =
      requirements.length > 0
        ? Math.round((completedRequirements.length / requirements.length) * 100)
        : 0;

    const completedRequirementsCount = completedRequirements.length;

    const taskProgress =
      tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    return {
      projectId,
      projectName: project.name,
      totalModules: modules.length,
      totalRequirements: requirements.length,
      completedRequirements: completedRequirementsCount,
      requirementProgress,
      totalTasks: tasks.length,
      completedTasks,
      taskProgress,
      totalStoryPoints,
      completedStoryPoints,
      totalEstimatedHours,
      totalActualHours,
      byRequirementStatus,
      byTaskStatus,
      burndownData: this.generateBurndownData(totalStoryPoints, completedStoryPoints),
    };
  }

  async getModuleProgress(moduleId: string): Promise<ModuleProgress> {
    const module = await this.featureModuleRepository.findOne({
      where: { id: moduleId },
    });

    if (!module) {
      throw new Error('Module not found');
    }

    const requirements = await this.requirementRepository.find({
      where: { moduleId },
      relations: ['children'],
    });

    const requirementsWithTasks = await Promise.all(
      requirements.map(async (r) => {
        const tasks = await this.taskRepository.find({ where: { requirementId: r.id } });
        const completedTasks = tasks.filter((t) => t.status === TaskStatus.DONE).length;

        return {
          id: r.id,
          title: r.title,
          status: r.status,
          taskCount: tasks.length,
          completedTaskCount: completedTasks,
        };
      }),
    );

    const completedCount = requirements.filter(
      (r) => r.status === RequirementStatus.COMPLETED,
    ).length;

    const progress =
      requirements.length > 0
        ? Math.round((completedCount / requirements.length) * 100)
        : 0;

    return {
      moduleId,
      moduleName: module.name,
      totalRequirements: requirements.length,
      completedRequirements: completedCount,
      progress,
      requirements: requirementsWithTasks,
    };
  }

  private generateBurndownData(
    total: number,
    completed: number,
  ): BurndownPoint[] {
    const points: BurndownPoint[] = [];
    const today = new Date();
    const startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    for (let i = 0; i <= 14; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const planned = Math.max(0, total - (total / 14) * i);
      const actual = i < 14 - Math.floor((completed / total) * 14) ? planned : Math.max(0, total - completed);

      points.push({
        date: date.toISOString().split('T')[0],
        planned: Math.round(planned * 10) / 10,
        actual: Math.round(actual * 10) / 10,
      });
    }

    return points;
  }
}
