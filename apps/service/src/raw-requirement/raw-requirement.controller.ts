import {
  Controller,
  Get,
  Delete,
  Post,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  Request,
  Logger,
  UseGuards,
  Put,
} from "@nestjs/common";
import { Response } from "express";
import { AuthGuard } from "@nestjs/passport";
import { RawRequirementService } from "./raw-requirement.service";
import { AiGenerationService } from "src/ai/ai-generation.service";
import { ProjectsService } from "src/projects/projects.service";
import { GenerateRawRequirementByLLMDto,CreateRawRequirementDto, RawRequirementResponseDto, ApiResponseDto, UpdateRawRequirementDto, RawRequirementListParams } from "@req2task/dto";

@Controller("raw-requirements")
@UseGuards(AuthGuard("jwt"))
export class RawRequirementController {
  private readonly logger = new Logger(RawRequirementController.name);

  constructor(
    private readonly rawRequirementService: RawRequirementService,
    private readonly aiGenerationService: AiGenerationService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get(":rawRequirementId")
  async getRawRequirement(
    @Param("rawRequirementId") rawRequirementId: string,
  ): Promise<ApiResponseDto<unknown>> {
    const result =
      await this.rawRequirementService.getRawRequirementById(rawRequirementId);
    return { code: 0, data: result };
  }

  @Post(":projectId/stream")
  @HttpCode(HttpStatus.OK)
  async streamGenerateRawRequirement(
    @Param("projectId") projectId: string,
    @Body() dto: GenerateRawRequirementByLLMDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const createdById = req.user?.id || "system";
    const project = await this.projectsService.findById(projectId);

    this.logger.log(
      `开始流式生成原始需求 | 项目: ${projectId} | 用户: ${createdById}`,
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const stream$ = this.aiGenerationService.streamGenerateRawRequirement(
      projectId,
      dto.conversationText,
      project.description,
      dto.previousQuestions,
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
        this.logger.log(`流式生成完成 | 项目: ${projectId}`);
        res.write("data: [DONE]\n\n");
        res.end();
      },
    });
  }

  @Post(":projectId")
  async createRawRequirement(
    @Param("projectId") projectId: string,
    @Body() dto: CreateRawRequirementDto,
    @Request() req: any,
  ): Promise<ApiResponseDto<RawRequirementResponseDto>> {
    const userId = req.user?.id || "system";
    const result =
      await this.rawRequirementService.create(projectId, dto, userId);
    return { code: 0, data: result, message: "创建成功"};
  }

  @Put(":rawRequirementId")
  async updateRawRequirement(
    @Param("rawRequirementId") rawRequirementId: string,
    @Body() dto: UpdateRawRequirementDto,
  ): Promise<ApiResponseDto<RawRequirementResponseDto>> {
    const result =
      await this.rawRequirementService.updateRawRequirement(rawRequirementId, dto);
    return { code: 0, data: result, message: "更新成功" };
  }
  

  @Delete(":rawRequirementId")
  async deleteRawRequirement(
    @Param("rawRequirementId") rawRequirementId: string,
  ): Promise<ApiResponseDto<null>> {
    await this.rawRequirementService.deleteRawRequirement(rawRequirementId);
    return { code: 0, message: "删除成功" };
  }


  @Get(":projectId/raw-requirements")
  async getRawRequirementsByProject(
    @Param("projectId") projectId: string,
    @Query() params: RawRequirementListParams,
    @Request() req: any,
  ): Promise<ApiResponseDto<RawRequirementResponseDto[]>> {
    const userId = req.user?.id || "system";
    const result =
      await this.rawRequirementService.getRawRequirementsByProject(projectId, params);
    return { code: 0, data: result };
  }

}
