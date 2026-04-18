import { Injectable, Logger } from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  Project,
  FeatureModule,
  Requirement,
  RawRequirement,
  LLMConfig,
  User,
} from "@req2task/core";
import {
  ProjectStatus,
  Priority,
  RequirementSource,
  RequirementStatus,
  RawRequirementStatus,
  LLMProviderType,
} from "@req2task/dto";

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log("Starting database seed...");

      const user = await this.getOrCreateDefaultUser(queryRunner);
      const project = await this.createProject(queryRunner, user.id);
      const modules = await this.createFeatureModules(queryRunner, project.id);
      await this.createRequirements(queryRunner, modules, user.id);
      await this.createRawRequirements(queryRunner, modules, user.id);
      await this.createLLMConfig(queryRunner);

      await queryRunner.commitTransaction();
      this.logger.log("Database seed completed successfully!");
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error("Database seed failed!", error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async getOrCreateDefaultUser(
    queryRunner: any
  ): Promise<{ id: string }> {
    let user = await queryRunner.manager.findOne(User, {
      where: { username: "admin" },
    });

    if (!user) {
      user = queryRunner.manager.create(User, {
        username: "admin",
        email: "admin@example.com",
        password: "$2b$10$rQZ5x8v5Z5x8v5Z5x8v5ZO5x8v5Z5x8v5Z5x8v5Z5x8v5Z5x8v",
        displayName: "Administrator",
        role: "ADMIN",
      });
      await queryRunner.manager.save(user);
      this.logger.log("Created default admin user");
    }

    return user;
  }

  private async createProject(
    queryRunner: any,
    ownerId: string
  ): Promise<Project> {
    let project = await queryRunner.manager.findOne(Project, {
      where: { projectKey: "REQ2TASK" },
    });

    if (!project) {
      project = queryRunner.manager.create(Project, {
        name: "req2task",
        projectKey: "REQ2TASK",
        description:
          "需求转任务系统 - 软件需求管理系统，支持需求全生命周期管理、多维度信息关联、AI辅助需求生成、变更追溯、项目进度可视化和项目知识库构建",
        status: ProjectStatus.PLANNING,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        ownerId,
      });
      await queryRunner.manager.save(project);
      this.logger.log("Created req2task project");
    } else {
      this.logger.log("req2task project already exists, skipping...");
    }

    return project;
  }

  private async createFeatureModules(
    queryRunner: any,
    projectId: string
  ): Promise<Map<string, FeatureModule>> {
    const moduleConfigs = [
      {
        name: "需求管理",
        moduleKey: "REQ-MGMT",
        description: "需求的全生命周期管理，包括需求的创建、编辑、审核、变更、追踪和归档",
        sort: 1,
      },
      {
        name: "任务管理",
        moduleKey: "TASK-MGMT",
        description: "任务的全生命周期管理，支持任务拆解、分配、执行和验收",
        sort: 2,
      },
      {
        name: "AI辅助",
        moduleKey: "AI-ASSIST",
        description: "AI辅助需求分析和任务生成功能",
        sort: 3,
      },
      {
        name: "项目管理",
        moduleKey: "PROJ-MGMT",
        description: "项目整体管理和进度可视化",
        sort: 4,
      },
      {
        name: "用户管理",
        moduleKey: "USER-MGMT",
        description: "用户账户和权限管理",
        sort: 5,
      },
      {
        name: "知识库",
        moduleKey: "KNOWLEDGE",
        description: "项目知识库构建和维护",
        sort: 6,
      },
    ];

    const modules = new Map<string, FeatureModule>();

    for (const config of moduleConfigs) {
      let module = await queryRunner.manager.findOne(FeatureModule, {
        where: { moduleKey: config.moduleKey, projectId },
      });

      if (!module) {
        module = queryRunner.manager.create(FeatureModule, {
          ...config,
          projectId,
        });
        await queryRunner.manager.save(module);
        this.logger.log(`Created module: ${config.name}`);
      } else {
        this.logger.log(`Module ${config.name} already exists, skipping...`);
      }

      modules.set(config.moduleKey, module);
    }

    return modules;
  }

  private async createRequirements(
    queryRunner: any,
    modules: Map<string, FeatureModule>,
    userId: string
  ): Promise<void> {
    const requirementsData: Array<{
      moduleKey: string;
      title: string;
      priority: Priority;
      description?: string;
    }> = [
      { moduleKey: "REQ-MGMT", title: "需求CRUD操作", priority: Priority.HIGH },
      { moduleKey: "REQ-MGMT", title: "需求状态流转", priority: Priority.HIGH },
      { moduleKey: "REQ-MGMT", title: "需求版本管理", priority: Priority.MEDIUM },
      { moduleKey: "REQ-MGMT", title: "需求变更记录", priority: Priority.HIGH },
      { moduleKey: "REQ-MGMT", title: "需求优先级管理", priority: Priority.MEDIUM },
      { moduleKey: "REQ-MGMT", title: "需求导入导出", priority: Priority.LOW },
      { moduleKey: "TASK-MGMT", title: "任务CRUD操作", priority: Priority.HIGH },
      { moduleKey: "TASK-MGMT", title: "任务分配", priority: Priority.HIGH },
      { moduleKey: "TASK-MGMT", title: "任务状态流转", priority: Priority.HIGH },
      { moduleKey: "TASK-MGMT", title: "任务进度追踪", priority: Priority.MEDIUM },
      { moduleKey: "TASK-MGMT", title: "任务依赖关系", priority: Priority.MEDIUM },
      { moduleKey: "AI-ASSIST", title: "AI需求分析", priority: Priority.HIGH },
      { moduleKey: "AI-ASSIST", title: "AI任务拆分", priority: Priority.HIGH },
      { moduleKey: "AI-ASSIST", title: "AI需求补全", priority: Priority.MEDIUM },
      { moduleKey: "AI-ASSIST", title: "AI变更影响分析", priority: Priority.MEDIUM },
      { moduleKey: "AI-ASSIST", title: "多模型支持", priority: Priority.MEDIUM },
      { moduleKey: "PROJ-MGMT", title: "项目CRUD操作", priority: Priority.HIGH },
      { moduleKey: "PROJ-MGMT", title: "项目成员管理", priority: Priority.HIGH },
      { moduleKey: "PROJ-MGMT", title: "项目进度仪表盘", priority: Priority.MEDIUM },
      { moduleKey: "PROJ-MGMT", title: "项目甘特图", priority: Priority.LOW },
      { moduleKey: "USER-MGMT", title: "用户认证", priority: Priority.HIGH },
      { moduleKey: "USER-MGMT", title: "用户授权", priority: Priority.HIGH },
      { moduleKey: "USER-MGMT", title: "用户角色管理", priority: Priority.MEDIUM },
      { moduleKey: "KNOWLEDGE", title: "文档管理", priority: Priority.MEDIUM },
      { moduleKey: "KNOWLEDGE", title: "文档检索", priority: Priority.MEDIUM },
      { moduleKey: "KNOWLEDGE", title: "文档关联", priority: Priority.LOW },
    ];

    for (const reqData of requirementsData) {
      const module = modules.get(reqData.moduleKey);
      if (!module) continue;

      const existing = await queryRunner.manager.findOne(Requirement, {
        where: { moduleId: module.id, title: reqData.title },
      });

      if (!existing) {
        const requirement = queryRunner.manager.create(Requirement, {
          moduleId: module.id,
          title: reqData.title,
          description: reqData.description || null,
          priority: reqData.priority,
          source: RequirementSource.MANUAL,
          status: RequirementStatus.DRAFT,
          storyPoints: 0,
          createdById: userId,
        });
        await queryRunner.manager.save(requirement);
        this.logger.log(`Created requirement: ${reqData.title}`);
      } else {
        this.logger.log(`Requirement ${reqData.title} already exists, skipping...`);
      }
    }
  }

  private async createRawRequirements(
    queryRunner: any,
    modules: Map<string, FeatureModule>,
    userId: string
  ): Promise<void> {
    const rawRequirementsData: Array<{
      moduleKey: string;
      content: string;
      source: string;
    }> = [
      {
        moduleKey: "REQ-MGMT",
        content: "我们需要一个需求管理系统，能够管理需求的完整生命周期",
        source: "用户访谈",
      },
      {
        moduleKey: "REQ-MGMT",
        content: "系统应该支持需求的创建、编辑、审核、变更和归档",
        source: "用户访谈",
      },
      {
        moduleKey: "REQ-MGMT",
        content: "需要支持需求的优先级和状态管理",
        source: "用户访谈",
      },
      {
        moduleKey: "TASK-MGMT",
        content: "系统应该能够将需求拆分成可执行的任务",
        source: "用户访谈",
      },
      {
        moduleKey: "TASK-MGMT",
        content: "任务应该支持分配给团队成员，并追踪执行进度",
        source: "用户访谈",
      },
      {
        moduleKey: "AI-ASSIST",
        content: "希望系统能够通过AI辅助生成需求分析",
        source: "产品规划",
      },
      {
        moduleKey: "AI-ASSIST",
        content: "AI应该能够理解自然语言需求并生成结构化需求",
        source: "产品规划",
      },
      {
        moduleKey: "PROJ-MGMT",
        content: "需要提供项目整体视图，包括进度和资源使用情况",
        source: "项目管理需求",
      },
      {
        moduleKey: "USER-MGMT",
        content: "系统应该支持多用户协作和权限控制",
        source: "安全需求",
      },
      {
        moduleKey: "KNOWLEDGE",
        content: "希望能够沉淀项目知识，支持文档的创建和检索",
        source: "知识管理需求",
      },
    ];

    for (const rawData of rawRequirementsData) {
      const module = modules.get(rawData.moduleKey);
      if (!module) continue;

      const existing = await queryRunner.manager.findOne(RawRequirement, {
        where: { moduleId: module.id, originalContent: rawData.content },
      });

      if (!existing) {
        const rawRequirement = queryRunner.manager.create(RawRequirement, {
          moduleId: module.id,
          originalContent: rawData.content,
          source: rawData.source,
          status: RawRequirementStatus.PENDING,
          createdById: userId,
        });
        await queryRunner.manager.save(rawRequirement);
        this.logger.log(`Created raw requirement: ${rawData.content.substring(0, 30)}...`);
      } else {
        this.logger.log(`Raw requirement already exists, skipping...`);
      }
    }
  }

  private async createLLMConfig(queryRunner: any): Promise<void> {
    let config = await queryRunner.manager.findOne(LLMConfig, {
      where: { modelName: "qwen6:8b", provider: LLMProviderType.OLLAMA },
    });

    if (!config) {
      config = queryRunner.manager.create(LLMConfig, {
        name: "Ollama Default",
        provider: LLMProviderType.OLLAMA,
        apiKey: "",
        baseUrl: "http://localhost:11434",
        modelName: "qwen6:8b",
        maxTokens: 4096,
        temperature: 0.7,
        topP: 1.0,
        isActive: true,
        isDefault: true,
      });
      await queryRunner.manager.save(config);
      this.logger.log("Created ollama LLM config (qwen6:8b)");
    } else {
      this.logger.log("ollama LLM config already exists, updating...");
      config.name = "Ollama Default";
      config.baseUrl = "http://localhost:11434";
      config.isActive = true;
      config.isDefault = true;
      await queryRunner.manager.save(config);
    }
  }
}
