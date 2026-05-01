import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
  HttpCode,
  HttpStatus,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { AuthGuard } from "@nestjs/passport";
import { RequirementsService } from "./requirements.service";
import { RequirementStateService } from "@req2task/core";
import {
  CreateRequirementDto,
  UpdateRequirementDto,
  TransitionStatusDto,
  ReviewRequirementDto,
  RequirementResponseDto,
  RequirementListResponseDto,
  ChangeHistoryResponseDto,
  AllowedTransitionsDto,
} from "@req2task/dto";
import { RawRequirementService } from "../raw-requirement/raw-requirement.service";
import { AiGenerationService } from "../ai/ai-generation.service";
import { ProjectsService } from "src/projects/projects.service";
import { FeatureModulesService } from "src/feature-modules/feature-modules.service";

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

interface AuthenticatedRequest {
  user: {
    userId: string;
    username: string;
  };
}

@Controller()
@UseGuards(AuthGuard("jwt"))
export class RequirementsController {
  private readonly logger = new Logger(RequirementsController.name);

  constructor(
    private readonly requirementsService: RequirementsService,
    private readonly requirementStateService: RequirementStateService,
    private readonly rawRequirementService: RawRequirementService,
    private readonly aiGenerationService: AiGenerationService,
    private readonly projectsService: ProjectsService,
    private readonly modulesService: FeatureModulesService,
  ) {}

  @Post("requirements/modules/:moduleId/requirements")
  async create(
    @Param("moduleId") moduleId: string,
    @Body() createDto: CreateRequirementDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<RequirementResponseDto>> {
    const user = req.user as { id?: string; userId?: string };
    const userId = user.id || user.userId;
    const result = await this.requirementsService.create(
      moduleId || null,
      createDto,
      userId!,
    );
    return { code: 0, data: result };
  }

  @Get("requirements/modules/:moduleId/requirements")
  async findByModule(
    @Param("moduleId") moduleId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ): Promise<ApiResponse<RequirementListResponseDto>> {
    const result = await this.requirementsService.findByModule(
      moduleId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { code: 0, data: result };
  }

  @Get("requirements/projects/:projectId/requirements")
  async findByProject(
    @Param("projectId") projectId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ): Promise<ApiResponse<RequirementListResponseDto>> {
    const result = await this.requirementsService.findByProject(
      projectId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { code: 0, data: result };
  }

  @Get("requirements/:id")
  async findById(
    @Param("id") id: string,
  ): Promise<ApiResponse<RequirementResponseDto>> {
    const result = await this.requirementsService.findById(id);
    return { code: 0, data: result };
  }

  @Put("requirements/:id")
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateRequirementDto,
  ): Promise<ApiResponse<RequirementResponseDto>> {
    const result = await this.requirementsService.update(id, updateDto);
    return { code: 0, data: result };
  }

  @Delete("requirements/:id")
  async delete(@Param("id") id: string): Promise<ApiResponse<null>> {
    await this.requirementsService.delete(id);
    return { code: 0, message: "删除成功" };
  }

  @Post("requirements/:id/transition")
  async transitionStatus(
    @Param("id") id: string,
    @Body() transitionDto: TransitionStatusDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<RequirementResponseDto>> {
    const user = req.user as { id?: string; userId?: string };
    const userId = user.id || user.userId;
    const result = await this.requirementStateService.transitionStatus(
      id,
      transitionDto.targetStatus,
      userId!,
      transitionDto.comment,
    );
    return { code: 0, data: result };
  }

  @Get("requirements/:id/allowed-transitions")
  async getAllowedTransitions(
    @Param("id") id: string,
  ): Promise<ApiResponse<AllowedTransitionsDto>> {
    const requirement = await this.requirementsService.findById(id);
    const allowedTransitions =
      await this.requirementStateService.getAllowedTransitions(
        requirement.status,
      );
    return { code: 0, data: { allowedTransitions } };
  }

  @Get("requirements/:id/change-history")
  async getChangeHistory(
    @Param("id") id: string,
  ): Promise<ApiResponse<ChangeHistoryResponseDto>> {
    const logs = await this.requirementStateService.getChangeHistory(id);
    return {
      code: 0,
      data: {
        logs: logs.map((log) => ({
          id: log.id,
          requirementId: log.requirementId,
          changeType: log.changeType,
          oldValue: log.oldValue,
          newValue: log.newValue,
          fromStatus: log.fromStatus,
          toStatus: log.toStatus,
          comment: log.comment,
          changedBy: log.changedBy
            ? {
                id: log.changedBy.id,
                displayName: log.changedBy.displayName,
                username: log.changedBy.username,
              }
            : undefined,
          createdAt: log.createdAt,
        })),
        total: logs.length,
      },
    };
  }

  @Post("requirements/:id/review")
  async reviewRequirement(
    @Param("id") id: string,
    @Body() reviewDto: ReviewRequirementDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<RequirementResponseDto>> {
    const user = req.user as { id?: string; userId?: string };
    const userId = user.id || user.userId;
    const result = await this.requirementStateService.reviewRequirement(
      id,
      reviewDto.approved,
      userId!,
      reviewDto.comment,
    );
    return { code: 0, data: result };
  }

  @Post("requirements/generate/stream")
  @HttpCode(HttpStatus.OK)
  async streamGenerateRequirements(
    @Body("rawRequirementId") rawRequirementId: string,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const user = req.user as { id?: string; userId?: string };
    const userId = user.id || user.userId;

    const rawRequirement =
      await this.rawRequirementService.getRawRequirementById(rawRequirementId);
    if (!rawRequirement) {
      res.write(
        `data: ${JSON.stringify({ type: "error", message: "原始需求不存在" })}\n\n`,
      );
      res.end();
      return;
    }

    const project = await this.projectsService.findById(
      rawRequirement.projectId,
    );

    this.logger.log(
      `开始流式生成需求 | 原始需求: ${rawRequirementId} | 用户: ${userId}`,
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const requirementPrompt = `原始需求内容: 
    \`\`\`text 
    ${rawRequirement.content}
    \`\`\`
    问答记录: ${JSON.stringify(rawRequirement.questionAndAnswers || [])}`;

    // 获取项目所有模块
    const modules = await this.modulesService.findByProject(rawRequirement.projectId,1,1000000);
    const existing = modules.items.map((module) => module.id+', '+module.path+', '+module.description).join('\n');
    const stream$ = await this.aiGenerationService.streamGenerateRequirements(
      rawRequirement.projectId,
      requirementPrompt,
      rawRequirementId,
      project.description,
      existing,
    );

    stream$.subscribe({
      next: (chunk) => {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      },
      error: (error: Error) => {
        this.logger.error({ error }, "SSE stream error");
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            message: error.message,
          })}\n\n`,
        );
        res.end();
      },
      complete: () => {
        this.logger.log(`流式生成完成 | 原始需求: ${rawRequirementId}`);
        res.write("data: [DONE]\n\n");
        res.end();
      },
    });
  }

  @Post("requirements/batch")
  async batchCreateRequirements(
    @Body("requirements") requirements: CreateRequirementDto[],
    @Body("moduleId") moduleId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<RequirementResponseDto[]>> {
    const user = req.user as { id?: string; userId?: string };
    const userId = user.id || user.userId;

    // 批量创建需求
    const createdRequirements = [];
    for (const reqDto of requirements) {
      const created = await this.requirementsService.create(
        moduleId || null,
        reqDto,
        userId!,
      );
      createdRequirements.push(created);
    }

    return { code: 0, data: createdRequirements };
  }
}
