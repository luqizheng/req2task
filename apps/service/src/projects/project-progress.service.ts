import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, Requirement, Task, FeatureModule } from '@req2task/core';
import { RequirementStatus, TaskStatus } from '@req2task/dto';
import {
  ProjectProgressDto,
  BurndownPointDto,
  BurndownQueryDto,
  BurndownDataDto,
  ModuleProgressDto,
} from '@req2task/dto';

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

  async getProjectProgress(projectId: string): Promise<ProjectProgressDto> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

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

    const taskProgress =
      tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const burndownData = await this.getBurndownData(projectId, totalStoryPoints);

    return {
      projectId,
      projectName: project.name,
      totalModules: modules.length,
      totalRequirements: requirements.length,
      completedRequirements: completedRequirements.length,
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
      burndownData,
    };
  }

  async getBurndownData(projectId: string, totalStoryPoints?: number): Promise<BurndownPointDto[]> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const modules = await this.featureModuleRepository.find({ where: { projectId } });
    const moduleIds = modules.map((m) => m.id);

    const requirements = moduleIds.length > 0
      ? await this.requirementRepository.find({
          where: moduleIds.map((id) => ({ moduleId: id })),
        })
      : [];

    const totalPoints = totalStoryPoints ?? requirements.reduce((sum, r) => sum + r.storyPoints, 0);

    const today = new Date();
    const startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    const completedReqs = requirements.filter(
      (r) => r.status === RequirementStatus.COMPLETED && r.updatedAt >= startDate,
    );
    const completedPoints = completedReqs.reduce((sum, r) => sum + r.storyPoints, 0);

    const points: BurndownPointDto[] = [];
    const daysDiff = 14;

    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const planned = Math.max(0, totalPoints - (totalPoints / daysDiff) * i);

      const progressRatio = completedPoints / totalPoints;
      const daysProgressed = Math.floor(progressRatio * daysDiff);
      const actual = i <= daysProgressed
        ? Math.max(0, totalPoints - (totalPoints / daysDiff) * i)
        : Math.max(0, totalPoints - completedPoints);

      const remainingTasks = Math.max(0, Math.round((1 - i / daysDiff) * requirements.length));

      points.push({
        date: date.toISOString().split('T')[0],
        planned: Math.round(planned * 10) / 10,
        actual: Math.round(actual * 10) / 10,
        remainingTasks,
      });
    }

    return points;
  }

  async getDetailedBurndown(
    projectId: string,
    query: BurndownQueryDto,
  ): Promise<BurndownDataDto> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

    const modules = await this.featureModuleRepository.find({ where: { projectId } });
    const moduleIds = modules.map((m) => m.id);

    const requirements = moduleIds.length > 0
      ? await this.requirementRepository.find({
          where: moduleIds.map((id) => ({ moduleId: id })),
        })
      : [];

    const totalStoryPoints = requirements.reduce((sum, r) => sum + r.storyPoints, 0);

    const completedReqs = requirements.filter(
      (r) =>
        r.status === RequirementStatus.COMPLETED &&
        r.updatedAt >= startDate &&
        r.updatedAt <= endDate,
    );
    const completedPoints = completedReqs.reduce((sum, r) => sum + r.storyPoints, 0);

    const idealLine: number[] = [];
    const actualLine: number[] = [];
    const remainingTasks: number[] = [];

    for (let i = 0; i <= daysDiff; i++) {
      const planned = Math.max(0, totalStoryPoints - (totalStoryPoints / daysDiff) * i);
      idealLine.push(Math.round(planned * 10) / 10);

      const progressRatio = totalStoryPoints > 0 ? completedPoints / totalStoryPoints : 0;
      const daysProgressed = Math.floor(progressRatio * daysDiff);
      const actual = i <= daysProgressed
        ? Math.max(0, totalStoryPoints - (totalStoryPoints / daysDiff) * i)
        : Math.max(0, totalStoryPoints - completedPoints);
      actualLine.push(Math.round(actual * 10) / 10);

      const remaining = requirements.filter(
        (r) =>
          r.status !== RequirementStatus.COMPLETED ||
          r.updatedAt > new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
      ).length;
      remainingTasks.push(remaining);
    }

    return {
      projectId,
      startDate: query.startDate,
      endDate: query.endDate,
      totalStoryPoints,
      idealLine,
      actualLine,
      remainingTasks,
    };
  }

  async getModuleProgress(moduleId: string): Promise<ModuleProgressDto> {
    const module = await this.featureModuleRepository.findOne({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const requirements = await this.requirementRepository.find({
      where: { moduleId },
      relations: ['children'],
    });

    const requirementsWithTasks = await Promise.all(
      requirements.map(async (r) => {
        const tasks = await this.taskRepository.find({ where: { requirementId: r.id } });
        const completedTasksCount = tasks.filter((t) => t.status === TaskStatus.DONE).length;

        return {
          id: r.id,
          title: r.title,
          status: r.status,
          taskCount: tasks.length,
          completedTaskCount: completedTasksCount,
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
}
