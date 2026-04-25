import {
  Controller,
  Post,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  Request,
  Logger,
} from "@nestjs/common";
import { AiGenerationService } from "./ai-generation.service";
import {
  GenerateRequirementsDto,
  GenerateUserStoriesDto,
  GenerateTasksDto,
  GenerateModulesDto,
  GenerateRawRequirementByLLMDto,
} from "@req2task/dto";
import { ProjectsService } from "src/projects/projects.service";
import { LLmClientService } from "./llm-client.service";

@Controller("ai/generation")
export class AiGenerationController {
  private readonly logger = new Logger(AiGenerationController.name);

  constructor(
    private readonly aiGenerationService: AiGenerationService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post("raw-requirements/:projectId")
  @HttpCode(HttpStatus.CREATED)
  async generateRawRequirement(
    @Param("projectId") projectId: string,
    @Body() dto: GenerateRawRequirementByLLMDto,
    @Request() req: any,
  ) {
    const createdById = req.user?.id || "system";
    const project = await this.projectsService.findById(projectId);

    this.logger.log(
      `开始生成原始需求 | 项目: ${projectId} | 用户: ${createdById} | submit ${dto.conversationText}`,
    );

    const result = await this.aiGenerationService.generateRawRequirement(
      projectId,
      dto.conversationText,
      createdById,
      project.description,
    );

    this.logger.log(
      `原始需求生成完成 | 项目: ${projectId} | 需求ID: ${result.rawRequirement?.id || "N/A"} | 原始内容长度: ${result.rawContent?.length || 0}`,
    );

    return {
      code: 0,
      data: {
        rawRequirement: result.rawRequirement
          ? {
              id: result.rawRequirement.id,
              projectId: result.rawRequirement.projectId,
              originalContent: result.rawRequirement.originalContent,
              collectionType: result.rawRequirement.collectionType,
              source: result.rawRequirement.source,
              keyElements: result.rawRequirement.keyElements,
              status: result.rawRequirement.status,
              questionAndAnswers: result.rawRequirement.questionAndAnswers,
              createdAt: result.rawRequirement.createdAt,
            }
          : null,
        rawContent: result.rawContent,
        followUpQuestions: result.followUpQuestions,
        keyElements: result.keyElements,
      },
    };
  }

  @Post("requirements")
  @HttpCode(HttpStatus.CREATED)
  async generateRequirements(
    @Body() dto: GenerateRequirementsDto,
    @Request() req: any,
  ) {
    const createdById = req.user?.id || "system";

    const result = await this.aiGenerationService.generateRequirements(
      dto.projectId,
      dto.rawRequirement,
      createdById,
      dto.context,
      dto.moduleIds,
    );

    return {
      code: 0,
      data: {
        requirements: result.requirements.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          priority: r.priority,
          status: r.status,
          source: r.source,
          storyPoints: r.storyPoints,
          moduleIds: r.moduleIds,
          parentId: r.parentId,
          createdAt: r.createdAt,
        })),
        rawContent: result.rawContent,
      },
    };
  }

  @Post("user-stories/:requirementId")
  @HttpCode(HttpStatus.CREATED)
  async generateUserStories(
    @Param("requirementId") requirementId: string,
    @Body() dto: GenerateUserStoriesDto,
    @Query("projectId") projectId: string,
    @Request() req: any,
  ) {
    const createdById = req.user?.id || "system";

    const result = await this.aiGenerationService.generateUserStories(
      requirementId,
      dto.featurePoints,
      projectId,
      createdById,
      dto.context,
    );

    return {
      code: 0,
      data: {
        userStories: result.userStories.map((us) => ({
          id: us.id,
          requirementId: us.requirementId,
          role: us.role,
          goal: us.goal,
          benefit: us.benefit,
          storyPoints: us.storyPoints,
          createdAt: us.createdAt,
        })),
        rawContent: result.rawContent,
      },
    };
  }

  @Post("tasks/:requirementId")
  @HttpCode(HttpStatus.CREATED)
  async generateTasks(
    @Param("requirementId") requirementId: string,
    @Body() dto: GenerateTasksDto,
    @Query("projectId") projectId: string,
    @Request() req: any,
  ) {
    const createdById = req.user?.id || "system";

    const result = await this.aiGenerationService.generateTasks(
      requirementId,
      dto.featurePoints,
      projectId,
      createdById,
      dto.context,
    );

    return {
      code: 0,
      data: {
        tasks: result.tasks.map((t) => ({
          id: t.id,
          taskNo: t.taskNo,
          title: t.title,
          description: t.description,
          requirementId: t.requirementId,
          status: t.status,
          priority: t.priority,
          estimatedHours: t.estimatedHours,
          createdAt: t.createdAt,
        })),
        rawContent: result.rawContent,
      },
    };
  }

  @Post("modules/:projectId")
  @HttpCode(HttpStatus.CREATED)
  async generateModules(
    @Param("projectId") projectId: string,
    @Body() dto: GenerateModulesDto,
    @Request() req: any,
  ) {
    const createdById = req.user?.id || "system";

    const result = await this.aiGenerationService.generateModules(
      projectId,
      dto.requirements,
      createdById,
      dto.context,
      dto.existingModulesTree,
    );

    return {
      code: 0,
      data: {
        modules: result.modules.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          moduleKey: m.moduleKey,
          sort: m.sort,
          parentId: m.parentId,
          projectId: m.projectId,
          createdAt: m.createdAt,
        })),
        rawContent: result.rawContent,
      },
    };
  }
}
