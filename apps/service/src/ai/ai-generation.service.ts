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
import { RequirementRelationDetectionService, RelatedRequirement } from "./requirement-relation-detection.service";

export interface GenerationResult {
  requirements?: Requirement[];
  userStories?: UserStory[];
  tasks?: Task[];
  modules?: FeatureModule[];
  rawRequirements?: RawRequirement[];
  rawContent?: string;
  followUpQuestions?: string[];
  keyElements?: string[];
  relatedRequirements?: RelatedRequirement[];
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
    private readonly promptService: PromptService,
    private readonly llmClient: LLmClientService,
    private readonly rawRequirementService: RawRequirementService,
    private readonly persistenceService: AiPersistenceService,
    private readonly relationDetectionService: RequirementRelationDetectionService,
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
  ): Promise<{ requirements: Requirement[]; rawContent: string; relatedRequirements?: RelatedRequirement[] }> {
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

    const relationResult = await this.relationDetectionService.detectRelations(
      rawRequirement,
      projectId,
      3,
    );

    let relatedRequirementsStr: string | undefined;
    if (relationResult.hasRelated) {
      const allRelated = [
        ...relationResult.conflictRequirements,
        ...relationResult.relatedRequirements,
      ];
      relatedRequirementsStr = allRelated
        .map(
          (r) =>
            `- [${r.relationType.toUpperCase()}] ${r.content} (相似度: ${(r.score * 100).toFixed(0)}%)`,
        )
        .join("\n");
    }

    const rendered = this.promptService.render("REQUIREMENT_GENERATION", {
      projectId,
      context,
      moduleIds,
      existingRequirements: existingRequirementsStr,
      relatedRequirements: relatedRequirementsStr,
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
          content: item.content || item.description || null,
          description: item.description || null,
          keyElements: item.keyElements || null,
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

    return {
      requirements,
      rawContent: result.content,
      relatedRequirements: relationResult.hasRelated
        ? [...relationResult.conflictRequirements, ...relationResult.relatedRequirements]
        : undefined,
    };
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
      throw new BadRequestException("Requirement not found");
    }

    const rendered = this.promptService.render("USER_STORY_GENERATION", {
      projectId,
      context,
      requirementTitle: requirement.title,
      requirementDescription: requirement.description,
      featurePoints,
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

    const rendered = this.promptService.render("TASK_BREAKDOWN", {
      projectId,
      requirementId,
      context,
      featurePoints,
      userStory: requirement.title,
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
