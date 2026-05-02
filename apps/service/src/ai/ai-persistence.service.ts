import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, EntityManager } from "typeorm";
import {
  Requirement,
  UserStory,
  AcceptanceCriteria,
  Task,
  FeatureModule,
  RawRequirement,
} from "@req2task/core";
import { TaskStatus, CriteriaType, RawRequirementStatus, TaskPriority, Priority, RequirementStatus, RequirementSource } from "@req2task/dto";
import { EntityKeyService, EntityKeyType } from "../common/services/entity-key.service";
import { RequirementVectorService } from "./requirement-vector.service";

@Injectable()
export class AiPersistenceService {
  private readonly logger = new Logger(AiPersistenceService.name);

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
    @InjectRepository(RawRequirement)
    private rawRequirementRepository: Repository<RawRequirement>,
    private readonly dataSource: DataSource,
    private readonly entityKeyService: EntityKeyService,
    private readonly vectorService: RequirementVectorService,
  ) {}

  extractJsonArray(content: string): any[] {
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
      this.logger.error(
        { error, content: content.substring(0, 500) },
        "Failed to extract JSON from content",
      );
      return [];
    }
  }

  extractAnalysisResult(content: string): {
    questions: string[];
    keyElements: string[];
  } {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          questions: parsed.questions?.map((q: any) => q.question) || [],
          keyElements: parsed.keyElements || [],
        };
      }
      return { questions: [], keyElements: [] };
    } catch {
      return { questions: [], keyElements: [] };
    }
  }

  mapPriority(priority: string): TaskPriority {
    const mapping: Record<string, TaskPriority> = {
      urgent: TaskPriority.URGENT,
      high: TaskPriority.HIGH,
      medium: TaskPriority.MEDIUM,
      low: TaskPriority.LOW,
    };
    return mapping[priority?.toLowerCase()] || TaskPriority.MEDIUM;
  }

  async persistRawRequirementWithAnalysis(
    content: string,
    projectId: string,
    createdById: string,
    followUpQuestions: string[],
    keyElements: string[],
  ): Promise<RawRequirement | null> {
    try {
      const questionAndAnswers = followUpQuestions.map((question, index) => ({
        id: `qa_${Date.now()}_${index}`,
        question,
        answer: null,
        createdAt: new Date().toISOString(),
        answeredAt: null,
      }));

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const rawRequirement = queryRunner.manager.create(RawRequirement, {
          projectId,
          originalContent: content,
          keyElements,
          status: RawRequirementStatus.PENDING,
          questionAndAnswers,
          createdById,
        });

        const saved = await queryRunner.manager.save(rawRequirement);
        await queryRunner.commitTransaction();
        this.logger.log(
          `Created raw requirement ${(saved as any).id} with ${followUpQuestions.length} follow-up questions`,
        );

        return saved;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error({ error }, "Failed to persist raw requirement");
      return null;
    }
  }

  async persistRequirements(
    content: string,
    projectId: string,
    createdById: string,
    moduleIds?: string[],
  ): Promise<Requirement[]> {
    try {
      const data = this.extractJsonArray(content);
      if (!data || data.length === 0) {
        this.logger.warn("No requirements found in AI response");
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
            content: item.content || item.description || null,
            description: item.description || null,
            keyElements: item.keyElements || null,
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
        this.logger.log(
          `Created ${requirements.length} requirements for project ${projectId}`,
        );

        for (const req of requirements) {
          try {
            await this.vectorService.indexRequirement(req);
          } catch (vectorError) {
            this.logger.warn(`Failed to index requirement ${req.id} to vector store: ${vectorError}`);
          }
        }

        return requirements;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error({ error }, "Failed to persist requirements");
      return [];
    }
  }

  async persistUserStories(
    content: string,
    requirementId: string,
  ): Promise<UserStory[]> {
    try {
      const data = this.extractJsonArray(content);
      if (!data || data.length === 0) {
        this.logger.warn("No user stories found in AI response");
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

          if (
            item.acceptanceCriteria &&
            Array.isArray(item.acceptanceCriteria)
          ) {
            for (const criteria of item.acceptanceCriteria) {
              const acceptanceCriteria = queryRunner.manager.create(
                AcceptanceCriteria,
                {
                  userStoryId: (saved as any).id,
                  criteriaType:
                    criteria.criteriaType || CriteriaType.FUNCTIONAL,
                  content: criteria.content,
                  testMethod: criteria.testMethod || null,
                },
              );
              await queryRunner.manager.save(acceptanceCriteria);
            }
          }
        }

        await queryRunner.commitTransaction();
        this.logger.log(
          `Created ${userStories.length} user stories for requirement ${requirementId}`,
        );

        return userStories;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error({ error }, "Failed to persist user stories");
      return [];
    }
  }

  async persistTasks(
    content: string,
    requirementId: string,
    projectId: string,
    createdById: string,
  ): Promise<Task[]> {
    try {
      const data = this.extractJsonArray(content);
      if (!data || data.length === 0) {
        this.logger.warn("No tasks found in AI response");
        return [];
      }

      const taskNos = await this.entityKeyService.generateEntityKey(
        projectId,
        EntityKeyType.TSK,
        data.length,
      );

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const tasks: Task[] = [];

        for (const [index, item] of data.entries()) {
          const task = queryRunner.manager.create(Task, {
            taskNo: taskNos[index],
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
        this.logger.log(
          `Created ${tasks.length} tasks for requirement ${requirementId}`,
        );

        return tasks;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error({ error }, "Failed to persist tasks");
      return [];
    }
  }

  async persistModules(
    content: string,
    projectId: string,
  ): Promise<FeatureModule[]> {
    try {
      const jsonMatch = content.match(/\{[\s\S]*"modules"[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn("No modules found in AI response");
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
        this.logger.log(
          `Created ${modules.length} modules for project ${projectId}`,
        );

        return modules;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error({ error }, "Failed to persist modules");
      return [];
    }
  }

  private async createModuleWithChildren(
    manager: EntityManager,
    data: Record<string, unknown>,
    projectId: string,
    parentId: string | null,
  ): Promise<FeatureModule> {
    const module = manager.create(FeatureModule, {
      name: data.name as string,
      description: (data.description as string) || null,
      moduleKey: data.moduleKey as string,
      sort: (data.sort as number) || 0,
      parentId,
      projectId,
    });

    const saved = await manager.save(module);

    const children = data.children;
    if (Array.isArray(children)) {
      for (const child of children) {
        await this.createModuleWithChildren(
          manager,
          child as Record<string, unknown>,
          projectId,
          saved.id,
        );
      }
    }

    return saved;
  }
}
