import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Requirement, UserStory, AcceptanceCriteria, Task, FeatureModule } from '@req2task/core';
import { PromptService } from '@req2task/core';
import { 
  RequirementStatus, 
  Priority, 
  RequirementSource, 
  TaskStatus, 
  TaskPriority,
  CriteriaType 
} from '@req2task/dto';
import { LLmClientService } from './llm-client.service';

export interface GenerationResult {
  requirements?: Requirement[];
  userStories?: UserStory[];
  tasks?: Task[];
  modules?: FeatureModule[];
  rawContent?: string;
  followUpQuestions?: string[];
  keyElements?: string[];
}

@Injectable()
export class AiGenerationService {
  private readonly logger = new Logger(AiGenerationService.name);

  constructor(
    @InjectRepository(Requirement)
    private requirementRepository: Repository<Requirement>,
    @InjectRepository(UserStory)
    private userStoryRepository: Repository<UserStory>,
    @InjectRepository(AcceptanceCriteria)
    private acceptanceCriteriaRepository: Repository<AcceptanceCriteria>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(FeatureModule)
    private featureModuleRepository: Repository<FeatureModule>,
    private readonly promptService: PromptService,
    private readonly llmClient: LLmClientService,
    private readonly dataSource: DataSource,
  ) {}

  async generateRequirements(
    projectId: string,
    rawRequirement: string,
    createdById: string,
    context?: string,
    moduleIds?: string[],
  ): Promise<{ requirements: Requirement[]; rawContent: string }> {
    const rendered = this.promptService.render('REQUIREMENT_GENERATION', {
      projectId,
      context,
      moduleIds,
      rawRequirement,
    });

    const content = await this.llmClient.generate({
      systemPrompt: rendered.systemPrompt,
      userPrompt: rendered.userPrompt,
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });

    const requirements = await this.persistRequirements(
      content,
      projectId,
      createdById,
      moduleIds,
    );

    return { requirements, rawContent: content };
  }

  async generateUserStories(
    requirementId: string,
    featurePoints: string,
    projectId: string,
    createdById: string,
    context?: string,
  ): Promise<{ userStories: UserStory[]; rawContent: string }> {
    const requirement = await this.requirementRepository.findOne({
      where: { id: requirementId },
    });

    if (!requirement) {
      throw new BadRequestException('Requirement not found');
    }

    const rendered = this.promptService.render('USER_STORY_GENERATION', {
      projectId,
      context,
      requirementTitle: requirement.title,
      requirementDescription: requirement.description,
      featurePoints,
    });

    const content = await this.llmClient.generate({
      systemPrompt: rendered.systemPrompt,
      userPrompt: rendered.userPrompt,
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });

    const userStories = await this.persistUserStories(content, requirementId);

    return { userStories, rawContent: content };
  }

  async generateTasks(
    requirementId: string,
    featurePoints: string,
    projectId: string,
    createdById: string,
    context?: string,
  ): Promise<{ tasks: Task[]; rawContent: string }> {
    const requirement = await this.requirementRepository.findOne({
      where: { id: requirementId },
    });

    if (!requirement) {
      throw new BadRequestException('Requirement not found');
    }

    const rendered = this.promptService.render('TASK_BREAKDOWN', {
      projectId,
      requirementId,
      context,
      featurePoints,
      userStory: requirement.title,
    });

    const content = await this.llmClient.generate({
      systemPrompt: rendered.systemPrompt,
      userPrompt: rendered.userPrompt,
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });

    const tasks = await this.persistTasks(content, requirementId, createdById);

    return { tasks, rawContent: content };
  }

  async generateModules(
    projectId: string,
    requirements: string,
    createdById: string,
    context?: string,
    existingModulesTree?: string,
  ): Promise<{ modules: FeatureModule[]; rawContent: string }> {
    const rendered = this.promptService.render('MODULE_DECOMPOSITION', {
      projectId,
      context,
      requirements,
      existingModulesTree,
    });

    const content = await this.llmClient.generate({
      systemPrompt: rendered.systemPrompt,
      userPrompt: rendered.userPrompt,
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });

    const modules = await this.persistModules(content, projectId);

    return { modules, rawContent: content };
  }

  private async persistRequirements(
    content: string,
    projectId: string,
    createdById: string,
    moduleIds?: string[],
  ): Promise<Requirement[]> {
    try {
      const data = this.extractJsonArray(content);
      if (!data || data.length === 0) {
        this.logger.warn('No requirements found in AI response');
        return [];
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const requirements: Requirement[] = [];

        for (const item of data) {
          const requirement = queryRunner.manager.create(Requirement, {
            title: item.title,
            description: item.description || null,
            priority: item.priority?.toUpperCase() || Priority.MEDIUM,
            source: RequirementSource.AI_GENERATED,
            status: RequirementStatus.DRAFT,
            storyPoints: item.storyPoints || 0,
            moduleIds: item.moduleIds || moduleIds || null,
            parentId: item.parentId || null,
            createdById,
            projectId,
          });

          const saved = await queryRunner.manager.save(requirement);
          requirements.push(saved);
        }

        await queryRunner.commitTransaction();
        this.logger.log(`Created ${requirements.length} requirements for project ${projectId}`);

        return requirements;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error({ error }, 'Failed to persist requirements');
      return [];
    }
  }

  private async persistUserStories(
    content: string,
    requirementId: string,
  ): Promise<UserStory[]> {
    try {
      const data = this.extractJsonArray(content);
      if (!data || data.length === 0) {
        this.logger.warn('No user stories found in AI response');
        return [];
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const userStories: UserStory[] = [];

        for (const item of data) {
          const userStory = queryRunner.manager.create(UserStory, {
            requirementId,
            role: item.role,
            goal: item.goal,
            benefit: item.benefit,
            storyPoints: item.storyPoints || 0,
          });

          const saved = await queryRunner.manager.save(userStory);
          userStories.push(saved);

          if (item.acceptanceCriteria && Array.isArray(item.acceptanceCriteria)) {
            for (const criteria of item.acceptanceCriteria) {
              const acceptanceCriteria = queryRunner.manager.create(AcceptanceCriteria, {
                userStoryId: saved.id,
                criteriaType: criteria.criteriaType || CriteriaType.FUNCTIONAL,
                content: criteria.content,
                testMethod: criteria.testMethod || null,
              });
              await queryRunner.manager.save(acceptanceCriteria);
            }
          }
        }

        await queryRunner.commitTransaction();
        this.logger.log(`Created ${userStories.length} user stories for requirement ${requirementId}`);

        return userStories;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error({ error }, 'Failed to persist user stories');
      return [];
    }
  }

  private async persistTasks(
    content: string,
    requirementId: string,
    createdById: string,
  ): Promise<Task[]> {
    try {
      const data = this.extractJsonArray(content);
      if (!data || data.length === 0) {
        this.logger.warn('No tasks found in AI response');
        return [];
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const tasks: Task[] = [];

        for (const item of data) {
          const taskNo = await this.generateTaskNo(queryRunner.manager);
          
          const task = queryRunner.manager.create(Task, {
            taskNo,
            title: item.title,
            description: item.description || null,
            requirementId,
            status: TaskStatus.TODO,
            priority: this.mapPriority(item.priority),
            estimatedHours: item.estimatedHours || null,
            createdById,
          });

          const saved = await queryRunner.manager.save(task);
          tasks.push(saved);
        }

        await queryRunner.commitTransaction();
        this.logger.log(`Created ${tasks.length} tasks for requirement ${requirementId}`);

        return tasks;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error({ error }, 'Failed to persist tasks');
      return [];
    }
  }

  private async persistModules(
    content: string,
    projectId: string,
  ): Promise<FeatureModule[]> {
    try {
      const jsonMatch = content.match(/\{[\s\S]*"modules"[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('No modules found in AI response');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const modulesData = parsed.modules || [];

      if (!modulesData || modulesData.length === 0) {
        return [];
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const modules: FeatureModule[] = [];

        for (const item of modulesData) {
          const module = await this.createModuleWithChildren(
            queryRunner.manager,
            item,
            projectId,
            null,
          );
          modules.push(module);
        }

        await queryRunner.commitTransaction();
        this.logger.log(`Created ${modules.length} modules for project ${projectId}`);

        return modules;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error({ error }, 'Failed to persist modules');
      return [];
    }
  }

  private async createModuleWithChildren(
    manager: any,
    data: any,
    projectId: string,
    parentId: string | null,
  ): Promise<FeatureModule> {
    const module = manager.create(FeatureModule, {
      name: data.name,
      description: data.description || null,
      moduleKey: data.moduleKey,
      sort: data.sort || 0,
      parentId,
      projectId,
    });

    const saved = await manager.save(module);

    if (data.children && Array.isArray(data.children)) {
      for (const child of data.children) {
        await this.createModuleWithChildren(manager, child, projectId, saved.id);
      }
    }

    return saved;
  }

  private async generateTaskNo(manager: any): Promise<string> {
    const result = await manager.query(
      "SELECT COALESCE(MAX(CAST(SUBSTRING(task_no, 5) AS INTEGER)), 0) + 1 as next_no FROM tasks WHERE task_no LIKE 'TASK%'"
    );
    const nextNo = result[0]?.next_no || 1;
    return `TASK${String(nextNo).padStart(5, '0')}`;
  }

  private mapPriority(priority: string): TaskPriority {
    const mapping: Record<string, TaskPriority> = {
      urgent: TaskPriority.URGENT,
      high: TaskPriority.HIGH,
      medium: TaskPriority.MEDIUM,
      low: TaskPriority.LOW,
    };
    return mapping[priority?.toLowerCase()] || TaskPriority.MEDIUM;
  }

  private extractJsonArray(content: string): any[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        const parsed = JSON.parse(jsonObjectMatch[0]);
        if (Array.isArray(parsed.data)) {
          return parsed.data;
        }
        if (Array.isArray(parsed.requirements)) {
          return parsed.requirements;
        }
        if (Array.isArray(parsed.items)) {
          return parsed.items;
        }
      }

      return [];
    } catch (error) {
      this.logger.error({ error, content: content.substring(0, 500) }, 'Failed to extract JSON from content');
      return [];
    }
  }
}
