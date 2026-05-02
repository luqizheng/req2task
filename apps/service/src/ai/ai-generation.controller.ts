import {
  Controller,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Request,
  Logger,
} from "@nestjs/common";
import { AiGenerationService } from "./ai-generation.service";
import {
  GenerateUserStoriesDto,
  GenerateTasksDto,
  GenerateModulesDto,
  GenerateAcceptanceCriteriaDto,
} from "@req2task/dto";
import { ProjectsService } from "src/projects/projects.service";

@Controller("llm/generation")
export class AiGenerationController {
  private readonly logger = new Logger(AiGenerationController.name);

  constructor(
    private readonly aiGenerationService: AiGenerationService,
    private readonly projectsService: ProjectsService,
  ) {}

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

  @Post("acceptance-criteria/:userStoryId")
  @HttpCode(HttpStatus.CREATED)
  async generateAcceptanceCriteria(
    @Param("userStoryId") userStoryId: string,
    @Body() dto: GenerateAcceptanceCriteriaDto,
  ) {
    const result = await this.aiGenerationService.generateAcceptanceCriteria(
      userStoryId,
      dto.context,
    );

    return {
      code: 0,
      data: {
        acceptanceCriteria: result.acceptanceCriteria.map((ac) => ({
          id: ac.id,
          userStoryId: ac.userStoryId,
          criteriaType: ac.criteriaType,
          content: ac.content,
          testMethod: ac.testMethod,
          createdAt: ac.createdAt,
        })),
        rawContent: result.rawContent,
      },
    };
  }
}
