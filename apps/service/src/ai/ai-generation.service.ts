import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Observable } from "rxjs";
import {
  Requirement,
  UserStory,
  Task,
  FeatureModule,
  RawRequirement,
  AcceptanceCriteria,
} from "@req2task/core";
import { PromptService } from "@req2task/core";
import { RequirementStatus, Priority, RequirementSource } from "@req2task/dto";
import { LLmClientService, LLMStreamChunk } from "./llm-client.service";
import { RawRequirementService } from "src/raw-requirement/raw-requirement.service";
import { AiPersistenceService } from "./ai-persistence.service";
import { RequirementVectorService } from "./requirement-vector.service";

export interface GenerationResult {
  requirements?: Requirement[];
  userStories?: UserStory[];
  tasks?: Task[];
  modules?: FeatureModule[];
  rawRequirements?: RawRequirement[];
  rawContent?: string;
  followUpQuestions?: string[];
  keyElements?: string[];
}

@Injectable()
export class AiGenerationService {
  private readonly logger = new Logger(AiGenerationService.name);

  constructor(
    @InjectRepository( Requirement)
    private requirementRepository: Repository<Requirement>,
    @InjectRepository(UserStory)
    private userStoryRepository: Repository<UserStory>,
    @InjectRepository(AcceptanceCriteria)
    private acceptanceCriteriaRepository: Repository<AcceptanceCriteria>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private readonly promptService: PromptService,
    private readonly llmClient: LLmClientService,
    private readonly rawRequirementService: RawRequirementService,
    private readonly persistenceService: AiPersistenceService,
    private readonly vectorService: RequirementVectorService,
  ) {}

  async generateRawRequirement(
    projectId: string,
    conversationText: string,
    createdById: string,
    context?: string,
    rawRequirementId?: string,
  ): Promise<{
    rawRequirement: RawRequirement;
    rawContent: string;
    followUpQuestions: string[];
    keyElements: string[];
  }> {
    if (!rawRequirementId) {
      const saveOpj = await this.rawRequirementService.addRawRequirement({
        projectId,
        content: conversationText,
        source: RequirementSource.MANUAL,
        userId: createdById,
      });
      rawRequirementId = saveOpj.id;
    }

    const rendered = this.promptService.render("RAW_REQUIREMENT_ANALYSIS", {
      projectId,
      context,
      rawRequirement: conversationText,
    });

    const result = await this.llmClient.generate({
      systemPrompt: rendered.systemPrompt,
      userPrompt: rendered.userPrompt,
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });

    const { questions, keyElements } = this.persistenceService.extractAnalysisResult(
      result.content,
    );
    const rawRequirement = await this.persistenceService.persistRawRequirementWithAnalysis(
      result.content,
      projectId,
      createdById,
      questions,
      keyElements,
    );

    return {
      rawRequirement,
      rawContent: result.content,
      followUpQuestions: questions,
      keyElements,
    };
  }

  streamGenerateRawRequirement(
    projectId: string,
    conversationText: string,
    context?: string,
    previousQuestions?: Array<{
      question: string;
      answer: string | null;
      purpose?: string;
    }>,
  ): Observable<LLMStreamChunk> {
    const title = `RawReq_${projectId}_${Date.now()}`;

    const rendered = this.promptService.render("RAW_REQUIREMENT_ANALYSIS", {
      projectId,
      context,
      rawRequirement: conversationText,
      previousQuestions,
    });

    return this.llmClient.streamGenerate({
      title,
      systemPrompt: rendered.systemPrompt,
      userPrompt: rendered.userPrompt,
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });
  }

  async streamGenerateRequirements(
    projectId: string,
    rawRequirement: string,
    rawRequirementId?: string,
    context?: string,
    existingModules?: string,
  ): Promise<Observable<LLMStreamChunk>> {
    const title = `ReqGen_${projectId}_${Date.now()}`;

    let existingRequirementsStr: string | undefined;
    if (rawRequirementId) {
      const existingRequirements = await this.requirementRepository.find({
        where: { sourceRawRequirementId: rawRequirementId },
        select: ["id", "title", "description", "priority", "storyPoints"],
      });
      if (existingRequirements.length > 0) {
        existingRequirementsStr = existingRequirements
          .map(
            (r) =>
              `- ${r.title}${r.description ? `：${r.description}` : ""} (优先级: ${r.priority}, 故事点: ${r.storyPoints})`,
          )
          .join("\n");
      }
    }

    const rendered = this.promptService.render("REQUIREMENT_GENERATION", {
      projectId,
      context,
      existingModules,
      existingRequirements: existingRequirementsStr,
      rawRequirement,
    });

    return this.llmClient.streamGenerate({
      title,
      systemPrompt: rendered.systemPrompt,
      userPrompt: rendered.userPrompt,
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });
  }

  streamGenerateTitle(content: string): Observable<LLMStreamChunk> {
    const title = `TitleGen_${Date.now()}`;

    const systemPrompt = `你是一个专业的需求分析师。请根据提供的原始需求内容，生成一个简洁、准确的标题。
标题要求：
1. 长度不超过50个字符
2. 准确概括需求的核心内容
3. 使用简洁的专业术语
4. 直接返回标题文本，不要有任何解释或额外内容`;

    const userPrompt = `请为以下原始需求生成标题：

${content}

标题：`

    return this.llmClient.streamGenerate({
      title,
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 100,
    });
  }

  async generateRequirements(
    projectId: string,
    rawRequirement: string,
    createdById: string,
    rawRequirementId?: string,
    context?: string,
    moduleIds?: string[],
    persist: boolean = true,
  ): Promise<{ requirements: Requirement[]; rawContent: string; filteredCount?: number; conflictCount?: number }> {
    let existingRequirementsStr: string | undefined;
    if (rawRequirementId) {
      const existingRequirements = await this.requirementRepository.find({
        where: { sourceRawRequirementId: rawRequirementId },
        select: ["id", "title", "description", "priority", "storyPoints"],
      });
      if (existingRequirements.length > 0) {
        existingRequirementsStr = existingRequirements
          .map(
            (r) =>
              `- ${r.title}${r.description ? `：${r.description}` : ""} (优先级: ${r.priority}, 故事点: ${r.storyPoints})`,
          )
          .join("\n");
      }
    }

    const rendered = this.promptService.render("REQUIREMENT_GENERATION", {
      projectId,
      context,
      moduleIds,
      existingRequirements: existingRequirementsStr,
      rawRequirement,
    });

    const result = await this.llmClient.generate({
      systemPrompt: rendered.systemPrompt,
      userPrompt: rendered.userPrompt,
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });

    let requirements: Requirement[] = [];
    if (persist) {
      requirements = await this.persistenceService.persistRequirements(
        result.content,
        projectId,
        createdById,
        moduleIds,
      );
    } else {
      const data = this.persistenceService.extractJsonArray(result.content);
      if (data && data.length > 0) {
        requirements = data.map((item) => ({
          id: "",
          entityKey: "",
          modules: [],
          title: item.title,
          description: item.description || null,
          keyElements: item.keyElements || null,
          featurePoints: item.featurePoints || null,
          priority: item.priority?.toUpperCase() || Priority.MEDIUM,
          source: RequirementSource.AI_GENERATED,
          status: RequirementStatus.DRAFT,
          storyPoints: item.storyPoints || 0,
          parentId: item.parentId || null,
          projectId,
          moduleId: item.moduleId || null,
          sourceRawRequirementId: item.sourceRawRequirementId || null,
          conversationId: null,
          reviewChainId: null,
          createdById,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          userStories: [],
          children: [],
          parent: null,
          sourceRawRequirement: null,
          followUpQuestions: item.followUpQuestions || [],
        } as Requirement));
      }
    }

    // 生成后相似度过滤和冲突检测
    const HIGH_SIMILARITY_THRESHOLD = 0.8;
    const MEDIUM_SIMILARITY_THRESHOLD = 0.6;
    const filteredRequirements: Array<Requirement & { conflictWarning?: string; relatedRequirementIds?: string[] }> = [];
    let filteredCount = 0;
    let conflictCount = 0;

    for (const req of requirements) {
      const reqContent = `${req.title} ${req.description || ""}`;
      const similarResults = await this.vectorService.searchSimilarRequirements(
        reqContent,
        projectId,
        3,
      );

      // 1. 高相似度（>80%）→ 过滤
      const highSimilarity = similarResults.filter((s) => s.score >= HIGH_SIMILARITY_THRESHOLD);
      if (highSimilarity.length > 0) {
        this.logger.warn(
          `Filtering out similar requirement: "${req.title}" (similarity: ${(highSimilarity[0].score * 100).toFixed(1)}%)`,
        );
        filteredCount++;
        continue;
      }

      // 2. 中等相似度（60%-80%）→ 冲突检测
      const mediumSimilarity = similarResults.filter(
        (s) => s.score >= MEDIUM_SIMILARITY_THRESHOLD && s.score < HIGH_SIMILARITY_THRESHOLD,
      );

      if (mediumSimilarity.length > 0) {
        const conflictResult = await this.detectConflictWithLLM(
          req,
          mediumSimilarity,
        );

        if (conflictResult.hasConflict) {
          (req as Requirement & { conflictWarning?: string }).conflictWarning =
            conflictResult.conflictDescription || "可能与现有需求存在逻辑冲突";
          (req as Requirement & { relatedRequirementIds?: string[] }).relatedRequirementIds =
            mediumSimilarity.map((s) => s.id);
          conflictCount++;
        }
      }

      filteredRequirements.push(req);
    }

    if (filteredCount > 0) {
      this.logger.warn(`Filtered ${filteredCount} requirements due to high similarity`);
    }
    if (conflictCount > 0) {
      this.logger.warn(`Detected ${conflictCount} requirements with potential conflicts`);
    }

    return {
      requirements: filteredRequirements,
      rawContent: result.content,
      filteredCount: filteredCount > 0 ? filteredCount : undefined,
      conflictCount: conflictCount > 0 ? conflictCount : undefined,
    };
  }

  private async detectConflictWithLLM(
    newRequirement: Requirement,
    similarRequirements: Array<{ id: string; content: string; score: number }>,
  ): Promise<{ hasConflict: boolean; conflictDescription?: string }> {
    try {
      const newReqContent = `${newRequirement.title}\n${newRequirement.description || ""}`;
      const existingReqsContent = similarRequirements
        .map((r, i) => `[${i + 1}] ${r.content}`)
        .join("\n\n");

      const systemPrompt = `你是需求冲突检测专家。分析新需求与现有需求是否存在逻辑冲突。

冲突类型包括：
1. 逻辑矛盾：两个需求不能同时成立
2. 互斥：实现一个需求会阻止另一个需求的实现
3. 边界冲突：功能范围重叠但定义不一致
4. 非冲突：需求互补、扩展或只是相似

输出格式：
{\n  "hasConflict": true/false,\n  "conflictDescription": "如果存在冲突，描述冲突点；如果不冲突，说明关系"\n}`;

      const userPrompt = `新需求：
${newReqContent}

相似的现有需求：
${existingReqsContent}

请分析新需求与现有需求的关系，返回JSON格式结果。`;

      const result = await this.llmClient.generate({
        systemPrompt,
        userPrompt,
        temperature: 0.2,
        maxTokens: 500,
      });

      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          hasConflict: parsed.hasConflict === true,
          conflictDescription: parsed.conflictDescription,
        };
      }

      return { hasConflict: false };
    } catch (error) {
      this.logger.error("Conflict detection failed", error instanceof Error ? error.stack : String(error));
      return { hasConflict: false };
    }
  }

  async generateFeaturePoints(
    requirementId: string,
    context?: string,
  ): Promise<{ featurePoints: string; rawContent: string }> {
    const requirement = await this.requirementRepository.findOne({
      where: { id: requirementId },
    });

    if (!requirement) {
      throw new BadRequestException("Requirement not found");
    }

    const rendered = this.promptService.render("FEATURE_POINT_GENERATION", {
      requirementTitle: requirement.title,
      requirementDescription: requirement.description,
      context,
    });

    const result = await this.llmClient.generate({
      systemPrompt: rendered.systemPrompt,
      userPrompt: rendered.userPrompt,
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });

    requirement.featurePoints = result.content;
    await this.requirementRepository.save(requirement);

    return { featurePoints: result.content, rawContent: result.content };
  }

  async generateUserStories(
    requirementId: string,
    projectId: string,
    createdById: string,
    context?: string,
    featurePoints?: string,
  ): Promise<{ userStories: UserStory[]; rawContent: string }> {
    const requirement = await this.requirementRepository.findOne({
      where: { id: requirementId },
      relations: ['userStories'],
    });

    if (!requirement) {
      throw new BadRequestException("Requirement not found");
    }

    const existingUserStories = requirement.userStories
      ?.map((us) => `【已有】作为${us.role}，我想要${us.goal}，以便${us.benefit}`)
      .join('\n') || '无';

    const content = requirement.featurePoints || [requirement.title, requirement.description].filter(Boolean).join("\n");

    const rendered = this.promptService.render("USER_STORY_GENERATION", {
      projectId,
      context,
      requirementTitle: requirement.title,
      requirementDescription: requirement.description,
      featurePoints: content,
      existingUserStories,
    });

    const result = await this.llmClient.generate({
      systemPrompt: rendered.systemPrompt,
      userPrompt: rendered.userPrompt,
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });

    const userStories = await this.persistenceService.persistUserStories(
      result.content,
      requirementId,
    );

    return { userStories, rawContent: result.content };
  }

  async generateUserStoriesOnly(
    requirementId: string,
  ): Promise<{
    userStories: Array<{
      role: string;
      goal: string;
      benefit: string;
      storyPoints: number;
      acceptanceCriteria?: Array<{
        criteriaType: string;
        content: string;
        testMethod?: string;
      }>;
    }>;
    rawContent: string;
  }> {
    const requirement = await this.requirementRepository.findOne({
      where: { id: requirementId },
      relations: ['userStories'],
    });

    if (!requirement) {
      throw new BadRequestException("Requirement not found");
    }

    const existingUserStories = requirement.userStories
      ?.map((us) => `【已有】作为${us.role}，我想要${us.goal}，以便${us.benefit}`)
      .join('\n') || '无';

    const content = requirement.featurePoints || [requirement.title, requirement.description].filter(Boolean).join("\n");

    const rendered = this.promptService.render("USER_STORY_GENERATION", {
      projectId: requirement.projectId,
      requirementTitle: requirement.title,
      requirementDescription: requirement.description,
      featurePoints: content,
      existingUserStories,
    });

    const result = await this.llmClient.generate({
      systemPrompt: rendered.systemPrompt,
      userPrompt: rendered.userPrompt,
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });

    const userStories = this.persistenceService.extractUserStories(
      result.content,
    );

    return { userStories, rawContent: result.content };
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
      throw new BadRequestException("Requirement not found");
    }

    const existingTasks = await this.taskRepository.find({
      where: { requirementId },
      select: ['id', 'title', 'description'],
    });

    const existingTasksStr = existingTasks
      .map((t) => `【已有】${t.title}${t.description ? ` - ${t.description}` : ''}`)
      .join('\n') || '无';

    const rendered = this.promptService.render("TASK_BREAKDOWN", {
      projectId,
      requirementId,
      context,
      featurePoints,
      userStory: requirement.title,
      existingTasks: existingTasksStr,
    });

    const result = await this.llmClient.generate({
      systemPrompt: rendered.systemPrompt,
      userPrompt: rendered.userPrompt,
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });

    const tasks = await this.persistenceService.persistTasks(
      result.content,
      requirementId,
      projectId,
      createdById,
    );

    return { tasks, rawContent: result.content };
  }

  async generateModules(
    projectId: string,
    requirements: string,
    createdById: string,
    context?: string,
    existingModulesTree?: string,
  ): Promise<{ modules: FeatureModule[]; rawContent: string }> {
    const rendered = this.promptService.render("MODULE_DECOMPOSITION", {
      projectId,
      context,
      requirements,
      existingModulesTree,
    });

    const result = await this.llmClient.generate({
      systemPrompt: rendered.systemPrompt,
      userPrompt: rendered.userPrompt,
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });

    const modules = await this.persistenceService.persistModules(
      result.content,
      projectId,
    );

    return { modules, rawContent: result.content };
  }

  async generateAcceptanceCriteria(
    userStoryId: string,
    context?: string,
  ): Promise<{ acceptanceCriteria: AcceptanceCriteria[]; rawContent: string }> {
    const userStory = await this.userStoryRepository.findOne({
      where: { id: userStoryId },
    });

    if (!userStory) {
      throw new BadRequestException("User story not found");
    }

    const rendered = this.promptService.render("ACCEPTANCE_CRITERIA_GENERATION", {
      context,
      userStory: `作为${userStory.role}，我想要${userStory.goal}，以便于${userStory.benefit}`,
    });

    const result = await this.llmClient.generate({
      systemPrompt: rendered.systemPrompt,
      userPrompt: rendered.userPrompt,
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });

    const data = this.persistenceService.extractJsonArray(result.content);
    const acceptanceCriteriaList: AcceptanceCriteria[] = [];

    if (data && data.length > 0) {
      for (const item of data) {
        const criteria = this.acceptanceCriteriaRepository.create({
          userStoryId,
          criteriaType: item.criteriaType || "functional",
          content: item.content,
          testMethod: item.testMethod || null,
        });
        const saved = await this.acceptanceCriteriaRepository.save(criteria);
        acceptanceCriteriaList.push(saved);
      }
    }

    return { acceptanceCriteria: acceptanceCriteriaList, rawContent: result.content };
  }
}
