import { Injectable, Logger } from "@nestjs/common";
import { DataSource } from 'typeorm';
import * as crypto from "crypto";
import {
  Project,
  FeatureModule,
  Requirement,
  RawRequirement,
  Task,
  User,
  UserStory,
  AcceptanceCriteria,
  Notification,
} from "@req2task/core";
import {
  ProjectStatus,
  Priority,
  RequirementSource,
  RequirementStatus,
  RawRequirementStatus,
  CollectionType,
  TaskStatus,
  TaskPriority,
  NotificationType,
  CriteriaType,
} from "@req2task/dto";

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);
  private entityKeyCounters: Map<string, number> = new Map();

  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log("Starting database seed...");

      const user = await this.getOrCreateDefaultUser(queryRunner);
      const project = await this.createProject(queryRunner, user.id);
      await this.initEntityKeyCounters(queryRunner, project.projectKey);
      const modules = await this.createFeatureModules(queryRunner, project.id);
      const requirements = await this.createRequirements(queryRunner, project.projectKey, modules, user.id);
      await this.createUserStories(queryRunner, requirements, user.id);
      await this.createRawRequirements(queryRunner, project.id, user.id);
      await this.createTasks(queryRunner, project.projectKey, requirements, user.id);
      await this.createNotifications(queryRunner, user.id);

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

  private async initEntityKeyCounters(queryRunner: any, projectKey: string): Promise<void> {
    this.entityKeyCounters = new Map();

    const reqRepo = queryRunner.manager.getRepository(Requirement);
    const rawRepo = queryRunner.manager.getRepository(RawRequirement);
    const taskRepo = queryRunner.manager.getRepository(Task);

    const reqCount = await reqRepo
      .createQueryBuilder("req")
      .where("req.entity_key LIKE :prefix", { prefix: `${projectKey}-REQ-%` })
      .getCount();
    this.entityKeyCounters.set(`REQ-${projectKey}`, reqCount);

    const rawCount = await rawRepo
      .createQueryBuilder("raw")
      .where("raw.entity_key LIKE :prefix", { prefix: `${projectKey}-RAW-%` })
      .getCount();
    this.entityKeyCounters.set(`RAW-${projectKey}`, rawCount);

    const taskCount = await taskRepo
      .createQueryBuilder("task")
      .where("task.entity_key LIKE :prefix", { prefix: `${projectKey}-TSK-%` })
      .getCount();
    this.entityKeyCounters.set(`TSK-${projectKey}`, taskCount);
  }

  private generateEntityKey(projectKey: string, type: "REQ" | "RAW" | "TSK"): string {
    const prefix = `${projectKey}-${type}`;
    const counter = (this.entityKeyCounters.get(prefix) || 0) + 1;
    this.entityKeyCounters.set(prefix, counter);
    return `${prefix}-${counter}`;
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
        passwordHash: "$2b$10$rQZ5x8v5Z5x8v5Z5x8v5Z5x8v5Z5x8v5Z5x8v5Z5x8v5Z5x8v5Z5x8v5Z5x8v5Z5x8v",
        displayName: "Administrator",
        role: 'admin',
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
    projectKey: string,
    modules: Map<string, FeatureModule>,
    userId: string
  ): Promise<Requirement[]> {
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

    const requirements: Requirement[] = [];

    for (const reqData of requirementsData) {
      const module = modules.get(reqData.moduleKey);
      if (!module) continue;

      const existing = await queryRunner.manager
        .createQueryBuilder(Requirement, 'req')
        .leftJoin('req.modules', 'module')
        .where('module.id = :moduleId', { moduleId: module.id })
        .andWhere('req.title = :title', { title: reqData.title })
        .getOne();

      if (!existing) {
        const requirement = queryRunner.manager.create(Requirement, {
          entityKey: this.generateEntityKey(projectKey, "REQ"),
          modules: [module],
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
        requirements.push(requirement);
      } else {
        this.logger.log(`Requirement ${reqData.title} already exists, skipping...`);
        requirements.push(existing);
      }
    }
    return requirements;
  }

  private async createRawRequirements(
    queryRunner: any,
    projectId: string,
    userId: string
  ): Promise<void> {
    const rawRequirementsData: Array<{
      content: string;
      source: string;
      collectionType: CollectionType;
      status: RawRequirementStatus;
      questionAndAnswers?: Array<{
        question: string;
        answer: string | null;
      }>;
    }> = [
      {
        content: "我们需要一个需求管理系统，能够管理需求的完整生命周期",
        source: "用户访谈",
        collectionType: CollectionType.INTERVIEW,
        status: RawRequirementStatus.PENDING,
        questionAndAnswers: [
          {
            question: "需求的生命周期包括哪些阶段？",
            answer: "包括创建、评审、批准、执行、变更、关闭等阶段。",
          },
          {
            question: "是否需要支持需求版本历史记录？",
            answer: "是的，每次变更都需要记录版本历史。",
          },
        ],
      },
      {
        content: "系统应该支持需求的创建、编辑、审核、变更和归档",
        source: "用户访谈",
        collectionType: CollectionType.INTERVIEW,
        status: RawRequirementStatus.PENDING,
        questionAndAnswers: [
          {
            question: "审核流程需要几级审批？",
            answer: "需要支持自定义审批流程，默认两级审批。",
          },
        ],
      },
      {
        content: "希望系统能够通过AI辅助生成需求分析",
        source: "产品规划",
        collectionType: CollectionType.OTHER,
        status: RawRequirementStatus.PENDING,
        questionAndAnswers: [
          {
            question: "AI需要分析哪些维度？",
            answer: "需要分析需求完整性、优先级建议、可行性评估等。",
          },
        ],
      },
      {
        content: "AI应该能够理解自然语言需求并生成结构化需求",
        source: "产品规划",
        collectionType: CollectionType.OTHER,
        status: RawRequirementStatus.PENDING,
      },
      {
        content: "希望AI能够自动生成用户故事和验收标准",
        source: "产品规划",
        collectionType: CollectionType.OTHER,
        status: RawRequirementStatus.COMPLETED,
        questionAndAnswers: [
          {
            question: "用户故事需要包含哪些字段？",
            answer: "角色、功能、价值三个要素。",
          },
          {
            question: "验收标准格式有要求吗？",
            answer: "使用Given-When-Then格式。",
          },
        ],
      },
      {
        content: "系统应该能够将需求拆分成可执行的任务",
        source: "技术评审",
        collectionType: CollectionType.DOCUMENT,
        status: RawRequirementStatus.COMPLETED,
        questionAndAnswers: [
          {
            question: "任务拆分粒度是什么？",
            answer: "拆分到8小时以内可完成的任务。",
          },
        ],
      },
      {
        content: "任务应该支持分配给团队成员，并追踪执行进度",
        source: "技术评审",
        collectionType: CollectionType.DOCUMENT,
        status: RawRequirementStatus.COMPLETED,
        questionAndAnswers: [
          {
            question: "需要支持哪些任务状态？",
            answer: "待办、进行中、待审核、已完成四个状态。",
          },
        ],
      },
    ];

    const projectKey = "REQ2TASK";

    for (const rawData of rawRequirementsData) {
      const existing = await queryRunner.manager.findOne(RawRequirement, {
        where: { projectId, originalContent: rawData.content },
      });

      if (!existing) {
        const questionAndAnswers = rawData.questionAndAnswers?.map((qa) => ({
          id: crypto.randomUUID(),
          question: qa.question,
          answer: qa.answer,
          createdAt: new Date().toISOString(),
          answeredAt: qa.answer ? new Date().toISOString() : null,
        })) || null;

        const rawRequirement = queryRunner.manager.create(RawRequirement, {
          entityKey: this.generateEntityKey(projectKey, "RAW"),
          projectId,
          collectionType: rawData.collectionType,
          originalContent: rawData.content,
          source: rawData.source,
          status: rawData.status,
          createdById: userId,
          questionAndAnswers,
          keyElements: [],
        });
        await queryRunner.manager.save(rawRequirement);
        this.logger.log(`Created raw requirement: ${rawData.content.substring(0, 30)}...`);
      } else {
        this.logger.log(`Raw requirement already exists, skipping...`);
      }
    }
  }

  private async createUserStories(
    queryRunner: any,
    requirements: Requirement[],
    _userId: string
  ): Promise<void> {
    const userStoriesData: Array<{
      requirementTitle: string;
      role: string;
      goal: string;
      benefit: string;
      storyPoints: number;
      acceptanceCriteria: Array<{
        criteriaType: CriteriaType;
        content: string;
        testMethod?: string;
      }>;
    }> = [
      {
        requirementTitle: "需求CRUD操作",
        role: "项目经理",
        goal: "创建和管理需求条目",
        benefit: "能够系统化管理所有需求，确保需求信息完整可追溯",
        storyPoints: 8,
        acceptanceCriteria: [
          { criteriaType: CriteriaType.FUNCTIONAL, content: "可以创建新需求，填写标题、描述、优先级", testMethod: "在需求列表页点击新建，填写表单后保存" },
          { criteriaType: CriteriaType.FUNCTIONAL, content: "可以编辑已有需求信息", testMethod: "进入需求详情页，点击编辑按钮修改内容" },
          { criteriaType: CriteriaType.FUNCTIONAL, content: "可以删除不需要的需求", testMethod: "在需求列表选择删除，确认后需求被移除" },
          { criteriaType: CriteriaType.USABILITY, content: "表单验证失败时显示友好提示", testMethod: "故意留空必填项，提交时看到错误提示" },
        ],
      },
      {
        requirementTitle: "需求状态流转",
        role: "项目经理",
        goal: "改变需求的工作流状态",
        benefit: "明确需求所处阶段，便于跟踪和管理",
        storyPoints: 5,
        acceptanceCriteria: [
          { criteriaType: CriteriaType.FUNCTIONAL, content: "需求可以设置为草稿、评审中、已批准、已拒绝状态", testMethod: "在需求详情页修改状态下拉框" },
          { criteriaType: CriteriaType.FUNCTIONAL, content: "状态变更自动记录时间戳", testMethod: "变更状态后查看变更历史" },
        ],
      },
      {
        requirementTitle: "AI需求分析",
        role: "需求分析师",
        goal: "获取AI对需求的智能分析",
        benefit: "快速获得需求完整性、可行性等维度的评估",
        storyPoints: 13,
        acceptanceCriteria: [
          { criteriaType: CriteriaType.FUNCTIONAL, content: "输入需求内容后，AI返回分析结果", testMethod: "在需求分析界面输入自然语言需求" },
          { criteriaType: CriteriaType.FUNCTIONAL, content: "分析结果包含完整性评分", testMethod: "查看分析报告中的是否完整指标" },
          { criteriaType: CriteriaType.FUNCTIONAL, content: "分析结果包含优先级建议", testMethod: "查看分析报告中的优先级建议" },
          { criteriaType: CriteriaType.NON_FUNCTIONAL, content: "AI响应时间不超过10秒", testMethod: "计时验证响应延迟" },
        ],
      },
      {
        requirementTitle: "AI任务拆分",
        role: "项目经理",
        goal: "自动将需求拆分为可执行任务",
        benefit: "减少人工拆解工作量，确保任务粒度合理",
        storyPoints: 13,
        acceptanceCriteria: [
          { criteriaType: CriteriaType.FUNCTIONAL, content: "AI生成的任务包含标题、描述、预估工时", testMethod: "对需求执行AI拆分，查看生成的任务列表" },
          { criteriaType: CriteriaType.FUNCTIONAL, content: "生成的任务可以直接保存到任务列表", testMethod: "确认保存后，任务出现在任务管理中" },
          { criteriaType: CriteriaType.PERFORMANCE, content: "单个需求拆分的任务数量不超过20个", testMethod: "大需求拆分后统计任务数量" },
        ],
      },
      {
        requirementTitle: "任务分配",
        role: "项目经理",
        goal: "将任务分配给团队成员",
        benefit: "明确责任归属，提高协作效率",
        storyPoints: 5,
        acceptanceCriteria: [
          { criteriaType: CriteriaType.FUNCTIONAL, content: "可以将任务分配给项目成员", testMethod: "在任务详情页选择执行人" },
          { criteriaType: CriteriaType.FUNCTIONAL, content: "被分配人会收到通知", testMethod: "查看被分配人的通知列表" },
          { criteriaType: CriteriaType.USABILITY, content: "支持批量分配任务", testMethod: "多选任务后批量设置执行人" },
        ],
      },
      {
        requirementTitle: "任务进度追踪",
        role: "项目经理",
        goal: "实时查看任务执行情况",
        benefit: "及时发现阻塞项，保障项目进度",
        storyPoints: 8,
        acceptanceCriteria: [
          { criteriaType: CriteriaType.FUNCTIONAL, content: "任务看板显示所有任务的当前状态", testMethod: "进入任务看板查看泳道" },
          { criteriaType: CriteriaType.FUNCTIONAL, content: "可以查看任务完成百分比", testMethod: "在任务详情页查看进度" },
          { criteriaType: CriteriaType.NON_FUNCTIONAL, content: "看板支持拖拽操作更新状态", testMethod: "拖动任务卡片到不同状态列" },
        ],
      },
      {
        requirementTitle: "项目进度仪表盘",
        role: "项目经理",
        goal: "全面掌握项目整体情况",
        benefit: "快速了解项目健康度，辅助决策",
        storyPoints: 8,
        acceptanceCriteria: [
          { criteriaType: CriteriaType.FUNCTIONAL, content: "仪表盘显示需求总数、进行中、已完成数量", testMethod: "进入项目仪表盘查看统计卡片" },
          { criteriaType: CriteriaType.FUNCTIONAL, content: "仪表盘显示任务完成率图表", testMethod: "查看环形进度图" },
          { criteriaType: CriteriaType.USABILITY, content: "数据每5分钟自动刷新", testMethod: "观察数据更新频率" },
        ],
      },
      {
        requirementTitle: "用户认证",
        role: "系统管理员",
        goal: "验证用户身份",
        benefit: "确保只有合法用户可以访问系统",
        storyPoints: 5,
        acceptanceCriteria: [
          { criteriaType: CriteriaType.SECURITY, content: "用户可以使用用户名密码登录", testMethod: "使用正确凭证登录系统" },
          { criteriaType: CriteriaType.SECURITY, content: "密码错误3次后账户锁定15分钟", testMethod: "连续输入错误密码后尝试登录" },
          { criteriaType: CriteriaType.SECURITY, content: "登录成功返回JWT Token", testMethod: "登录后检查响应中的token字段" },
        ],
      },
      {
        requirementTitle: "文档管理",
        role: "团队成员",
        goal: "上传和管理项目文档",
        benefit: "集中存储项目文档，便于共享和查阅",
        storyPoints: 8,
        acceptanceCriteria: [
          { criteriaType: CriteriaType.FUNCTIONAL, content: "支持上传Word、PDF、图片等格式", testMethod: "在文档管理页上传不同格式文件" },
          { criteriaType: CriteriaType.FUNCTIONAL, content: "可以创建文件夹组织文档", testMethod: "点击新建文件夹，输入名称" },
          { criteriaType: CriteriaType.USABILITY, content: "支持拖拽上传文件", testMethod: "拖动文件到上传区域" },
        ],
      },
      {
        requirementTitle: "文档检索",
        role: "团队成员",
        goal: "快速找到需要的文档",
        benefit: "节省查找文档的时间，提高工作效率",
        storyPoints: 5,
        acceptanceCriteria: [
          { criteriaType: CriteriaType.FUNCTIONAL, content: "支持按文件名搜索文档", testMethod: "在搜索框输入文件名" },
          { criteriaType: CriteriaType.FUNCTIONAL, content: "支持按文档类型筛选", testMethod: "点击类型筛选下拉框" },
          { criteriaType: CriteriaType.PERFORMANCE, content: "搜索结果在500ms内返回", testMethod: "计时验证搜索响应速度" },
        ],
      },
    ];

    for (const storyData of userStoriesData) {
      const requirement = requirements.find((r) => r.title === storyData.requirementTitle);
      if (!requirement) continue;

      const existing = await queryRunner.manager.findOne(UserStory, {
        where: { requirementId: requirement.id, role: storyData.role },
      });

      if (!existing) {
        const userStory = queryRunner.manager.create(UserStory, {
          requirementId: requirement.id,
          role: storyData.role,
          goal: storyData.goal,
          benefit: storyData.benefit,
          storyPoints: storyData.storyPoints,
        });
        await queryRunner.manager.save(userStory);
        this.logger.log(`Created user story: ${storyData.role} - ${storyData.goal.substring(0, 20)}...`);

        for (const acData of storyData.acceptanceCriteria) {
          const ac = queryRunner.manager.create(AcceptanceCriteria, {
            userStoryId: userStory.id,
            criteriaType: acData.criteriaType,
            content: acData.content,
            testMethod: acData.testMethod || null,
          });
          await queryRunner.manager.save(ac);
        }
        this.logger.log(`  - Added ${storyData.acceptanceCriteria.length} acceptance criteria`);
      } else {
        this.logger.log(`User story already exists, skipping...`);
      }
    }
  }

  private async createTasks(
    queryRunner: any,
    projectKey: string,
    requirements: Requirement[],
    userId: string
  ): Promise<void> {
    const tasksData: Array<{
      requirementTitle: string;
      title: string;
      description?: string;
      status: TaskStatus;
      priority: TaskPriority;
      estimatedHours: number;
      dueDate?: string;
    }> = [
      {
        requirementTitle: "需求CRUD操作",
        title: "设计需求数据模型",
        description: "定义需求实体的字段结构，包括标题、描述、优先级、状态等",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        estimatedHours: 4,
        dueDate: "2024-03-15",
      },
      {
        requirementTitle: "需求CRUD操作",
        title: "实现需求创建API",
        description: "实现POST /api/requirements接口，支持创建需求",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        estimatedHours: 8,
        dueDate: "2024-03-20",
      },
      {
        requirementTitle: "需求CRUD操作",
        title: "实现需求查询API",
        description: "实现GET /api/requirements接口，支持分页和筛选",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        estimatedHours: 6,
        dueDate: "2024-03-22",
      },
      {
        requirementTitle: "需求CRUD操作",
        title: "实现需求更新API",
        description: "实现PUT /api/requirements/:id接口，支持更新需求",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        estimatedHours: 4,
        dueDate: "2024-03-25",
      },
      {
        requirementTitle: "需求CRUD操作",
        title: "实现需求删除API",
        description: "实现DELETE /api/requirements/:id接口，支持软删除",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        estimatedHours: 2,
        dueDate: "2024-03-28",
      },
      {
        requirementTitle: "需求CRUD操作",
        title: "前端需求列表页面",
        description: "实现需求列表展示、分页、筛选功能",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        estimatedHours: 8,
        dueDate: "2024-03-30",
      },
      {
        requirementTitle: "需求CRUD操作",
        title: "前端需求详情页面",
        description: "实现需求详情展示和编辑表单",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        estimatedHours: 6,
        dueDate: "2024-04-05",
      },
      {
        requirementTitle: "AI需求分析",
        title: "设计AI分析接口",
        description: "定义AI分析服务的输入输出接口规范",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        estimatedHours: 4,
        dueDate: "2024-04-01",
      },
      {
        requirementTitle: "AI需求分析",
        title: "实现需求完整性分析",
        description: "使用AI分析需求是否包含必要信息",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        estimatedHours: 12,
        dueDate: "2024-04-10",
      },
      {
        requirementTitle: "AI需求分析",
        title: "实现优先级建议功能",
        description: "根据需求内容生成优先级建议和理由",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        estimatedHours: 8,
        dueDate: "2024-04-15",
      },
      {
        requirementTitle: "AI任务拆分",
        title: "设计任务拆分提示词",
        description: "编写AI任务拆分专用的提示词模板",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        estimatedHours: 6,
        dueDate: "2024-04-05",
      },
      {
        requirementTitle: "AI任务拆分",
        title: "实现任务生成逻辑",
        description: "调用AI服务生成任务列表并解析",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        estimatedHours: 16,
        dueDate: "2024-04-20",
      },
      {
        requirementTitle: "任务分配",
        title: "实现任务分配功能",
        description: "支持将任务分配给项目成员",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        estimatedHours: 4,
        dueDate: "2024-04-12",
      },
      {
        requirementTitle: "任务分配",
        title: "实现通知功能",
        description: "任务分配时发送站内通知",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        estimatedHours: 6,
        dueDate: "2024-04-18",
      },
      {
        requirementTitle: "任务进度追踪",
        title: "实现任务看板页面",
        description: "使用看板形式展示任务状态",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        estimatedHours: 12,
        dueDate: "2024-04-25",
      },
      {
        requirementTitle: "任务进度追踪",
        title: "实现拖拽更新状态",
        description: "支持拖拽任务卡片更新状态",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        estimatedHours: 8,
        dueDate: "2024-04-30",
      },
      {
        requirementTitle: "项目进度仪表盘",
        title: "设计仪表盘数据接口",
        description: "定义项目统计数据的聚合查询",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        estimatedHours: 4,
        dueDate: "2024-05-05",
      },
      {
        requirementTitle: "项目进度仪表盘",
        title: "实现仪表盘前端页面",
        description: "展示需求统计、任务完成率等图表",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        estimatedHours: 10,
        dueDate: "2024-05-12",
      },
      {
        requirementTitle: "用户认证",
        title: "实现JWT认证",
        description: "使用JWT实现无状态认证",
        status: TaskStatus.BLOCKED,
        priority: TaskPriority.HIGH,
        estimatedHours: 8,
        dueDate: "2024-05-01",
      },
      {
        requirementTitle: "用户认证",
        title: "实现登录接口",
        description: "POST /api/auth/login 登录接口",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        estimatedHours: 4,
        dueDate: "2024-05-08",
      },
      {
        requirementTitle: "文档管理",
        title: "集成MinIO对象存储",
        description: "配置MinIO实现文件上传下载",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        estimatedHours: 8,
        dueDate: "2024-05-15",
      },
      {
        requirementTitle: "文档管理",
        title: "实现文档管理页面",
        description: "前端文档上传、浏览、下载功能",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        estimatedHours: 10,
        dueDate: "2024-05-22",
      },
    ];

    for (const taskData of tasksData) {
      const requirement = requirements.find((r) => r.title === taskData.requirementTitle);
      if (!requirement) continue;

      const taskNo = `TSK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      const existing = await queryRunner.manager.findOne(Task, {
        where: { entityKey: this.generateEntityKey(projectKey, "TSK") },
      });

      if (!existing) {
        const task = queryRunner.manager.create(Task, {
          taskNo,
          entityKey: this.generateEntityKey(projectKey, "TSK"),
          title: taskData.title,
          description: taskData.description || null,
          requirementId: requirement.id,
          status: taskData.status,
          priority: taskData.priority,
          assignedToId: null,
          estimatedHours: taskData.estimatedHours,
          actualHours: taskData.status === TaskStatus.DONE ? taskData.estimatedHours * (0.8 + Math.random() * 0.4) : null,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
          parentTaskId: null,
          createdById: userId,
        });
        await queryRunner.manager.save(task);
        this.logger.log(`Created task: ${taskData.title}`);
      } else {
        this.logger.log(`Task already exists, skipping...`);
      }
    }
  }

  private async createNotifications(
    queryRunner: any,
    userId: string
  ): Promise<void> {
    const notificationsData: Array<{
      type: NotificationType;
      title: string;
      message: string;
      isRead: boolean;
      data?: Record<string, unknown>;
    }> = [
      {
        type: NotificationType.TASK_ASSIGNED,
        title: "新任务分配",
        message: "您被分配了任务：实现需求创建API",
        isRead: false,
        data: { taskId: "sample-task-1", requirementTitle: "需求CRUD操作" },
      },
      {
        type: NotificationType.TASK_UPDATED,
        title: "任务状态变更",
        message: "任务「设计需求数据模型」已完成",
        isRead: false,
        data: { taskId: "sample-task-2", oldStatus: "in_progress", newStatus: "done" },
      },
      {
        type: NotificationType.REQUIREMENT_CREATED,
        title: "新需求创建",
        message: "项目管理员创建了「AI任务拆分」需求",
        isRead: true,
        data: { requirementId: "sample-req-1" },
      },
      {
        type: NotificationType.REQUIREMENT_REVIEW,
        title: "需求待评审",
        message: "需求「AI需求分析」需要您进行评审",
        isRead: false,
        data: { requirementId: "sample-req-2" },
      },
      {
        type: NotificationType.TASK_COMPLETED,
        title: "任务完成提醒",
        message: "您负责的任务「实现需求查询API」已标记完成",
        isRead: true,
        data: { taskId: "sample-task-3" },
      },
      {
        type: NotificationType.TASK_UPDATED,
        title: "任务优先级调整",
        message: "任务「实现需求更新API」优先级已调整为高",
        isRead: false,
        data: { taskId: "sample-task-4", oldPriority: "medium", newPriority: "high" },
      },
      {
        type: NotificationType.REQUIREMENT_CHANGED,
        title: "需求变更通知",
        message: "需求「AI任务拆分」的内容已更新",
        isRead: false,
        data: { requirementId: "sample-req-3", changeType: "content_update" },
      },
      {
        type: NotificationType.PROJECT_MEMBER_ADDED,
        title: "项目邀请",
        message: "您已被添加为「req2task」项目的成员",
        isRead: true,
        data: { projectId: "sample-project-1", inviter: "admin" },
      },
    ];

    for (const notifData of notificationsData) {
      const existing = await queryRunner.manager.findOne(Notification, {
        where: { userId, title: notifData.title, message: notifData.message },
      });

      if (!existing) {
        const notification = queryRunner.manager.create(Notification, {
          userId,
          type: notifData.type,
          title: notifData.title,
          message: notifData.message,
          data: notifData.data || null,
          isRead: notifData.isRead,
        });
        await queryRunner.manager.save(notification);
        this.logger.log(`Created notification: ${notifData.title}`);
      } else {
        this.logger.log(`Notification already exists, skipping...`);
      }
    }
  }
}
