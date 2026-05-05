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
    const results: any[] = [];
    let buffer = '';
    let pos = 0;
    let inString = false;
    let escape = false;
    const stack: Array<{ type: 'object' | 'array'; startPos?: number }> = [];
    let foundArray = false;

    const flushObject = () => {
      if (stack.length > 0 && stack[stack.length - 1].type === 'object') {
        const startPos = stack[stack.length - 1].startPos;
        if (startPos !== undefined) {
          try {
            const jsonStr = buffer.substring(startPos, pos);
            const parsed = JSON.parse(jsonStr);
            if (foundArray && Array.isArray(parsed)) {
              results.push(...parsed);
            } else if (foundArray) {
              results.push(parsed);
            } else if (typeof parsed === 'object' && parsed !== null) {
              if (Array.isArray(parsed.tasks)) {
                results.push(...parsed.tasks);
              } else if (Array.isArray(parsed.data)) {
                results.push(...parsed.data);
              } else if (Array.isArray(parsed.items)) {
                results.push(...parsed.items);
              } else if (Array.isArray(parsed.requirements)) {
                results.push(...parsed.requirements);
              } else if (Array.isArray(parsed.userStories)) {
                results.push(...parsed.userStories);
              } else if (Array.isArray(parsed.acceptanceCriteria)) {
                results.push(...parsed.acceptanceCriteria);
              } else {
                results.push(parsed);
              }
            }
          } catch (_e) {
            // ignore parse error
          }
        }
      }
    };

    const feed = (chunk: string) => {
      buffer += chunk;
      while (pos < buffer.length) {
        const ch = buffer[pos];

        if (inString) {
          if (escape) escape = false;
          else if (ch === '\\') escape = true;
          else if (ch === '"') inString = false;
          pos++;
          continue;
        }

        if (ch === '"') {
          inString = true;
          pos++;
          continue;
        }

        if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') {
          pos++;
          continue;
        }

        if (ch === '{') {
          if (!foundArray && stack.length === 0) {
            const jsonMatch = buffer.substring(pos).match(/^\{[^{}]*\}/);
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed)) {
                  return parsed;
                }
                if (parsed.tasks) return parsed.tasks;
                if (parsed.data) return Array.isArray(parsed.data) ? parsed.data : [];
                if (parsed.items) return parsed.items;
                if (parsed.requirements) return parsed.requirements;
                if (parsed.userStories) return parsed.userStories;
              } catch (_e) {
                // ignore parse error
              }
            }
          }
          stack.push({ type: 'object', startPos: pos });
          pos++;
          continue;
        }

        if (ch === '[') {
          foundArray = true;
          stack.push({ type: 'array', startPos: pos });
          pos++;
          continue;
        }

        if (ch === '}') {
          if (stack.length > 0 && stack[stack.length - 1].type === 'object') {
            flushObject();
            stack.pop();
          }
          pos++;
          continue;
        }

        if (ch === ']') {
          if (stack.length > 0 && stack[stack.length - 1].type === 'array') {
            const startPos = stack[stack.length - 1].startPos;
            if (startPos !== undefined) {
              try {
                const jsonStr = buffer.substring(startPos, pos + 1);
                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed)) {
                  results.push(...parsed);
                }
              } catch (_e) {
                // ignore parse error
              }
            }
            stack.pop();
          }
          pos++;
          continue;
        }

        pos++;
      }
    };

    try {
      feed(content);

      if (results.length > 0) {
        return results;
      }

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (_e) {
          try {
            const unescapeAgain = JSON.parse(jsonMatch[0]);
            if (typeof unescapeAgain === 'string') {
              const parsed = JSON.parse(unescapeAgain);
              if (Array.isArray(parsed)) {
                return parsed;
              }
            }
          } catch (_e2) {
            // ignore parse error
          }
        }
      }

      const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        try {
          const parsed = JSON.parse(jsonObjectMatch[0]);
          if (Array.isArray(parsed)) return parsed;
          if (parsed.data) return Array.isArray(parsed.data) ? parsed.data : [];
          if (parsed.tasks) return parsed.tasks;
          if (parsed.items) return parsed.items;
          if (parsed.requirements) return parsed.requirements;
        } catch (_e) {
          // ignore parse error
        }
      }

      return [];
    } catch (error) {
      this.logger.error({ error, content: content.substring(0, 500) }, "Failed to extract JSON");
      return results.length > 0 ? results : [];
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

    const saved = await manager.save<FeatureModule>(module);

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
