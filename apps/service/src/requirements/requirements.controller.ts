import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirementsService } from './requirements.service';
import { RequirementStateService } from '@req2task/core';
import {
  CreateRequirementDto,
  UpdateRequirementDto,
  TransitionStatusDto,
  ReviewRequirementDto,
  RequirementResponseDto,
  RequirementListResponseDto,
  ChangeHistoryResponseDto,
  AllowedTransitionsDto,
} from '@req2task/dto';
import { RawRequirementService } from '../raw-requirement/raw-requirement.service';
import { AiGenerationService } from '../ai/ai-generation.service';

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
@UseGuards(AuthGuard('jwt'))
export class RequirementsController {
  constructor(
    private readonly requirementsService: RequirementsService,
    private readonly requirementStateService: RequirementStateService,
    private readonly rawRequirementService: RawRequirementService,
    private readonly aiGenerationService: AiGenerationService,
  ) {}

  @Post('requirements/modules/:moduleId/requirements')
  async create(
    @Param('moduleId') moduleId: string,
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

  @Get('requirements/modules/:moduleId/requirements')
  async findByModule(
    @Param('moduleId') moduleId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<RequirementListResponseDto>> {
    const result = await this.requirementsService.findByModule(
      moduleId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { code: 0, data: result };
  }

  @Get('requirements/projects/:projectId/requirements')
  async findByProject(
    @Param('projectId') projectId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<RequirementListResponseDto>> {
    const result = await this.requirementsService.findByProject(
      projectId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { code: 0, data: result };
  }

  @Get('requirements/:id')
  async findById(@Param('id') id: string): Promise<ApiResponse<RequirementResponseDto>> {
    const result = await this.requirementsService.findById(id);
    return { code: 0, data: result };
  }

  @Put('requirements/:id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRequirementDto,
  ): Promise<ApiResponse<RequirementResponseDto>> {
    const result = await this.requirementsService.update(id, updateDto);
    return { code: 0, data: result };
  }

  @Delete('requirements/:id')
  async delete(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.requirementsService.delete(id);
    return { code: 0, message: '删除成功' };
  }

  @Post('requirements/:id/transition')
  async transitionStatus(
    @Param('id') id: string,
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

  @Get('requirements/:id/allowed-transitions')
  async getAllowedTransitions(@Param('id') id: string): Promise<ApiResponse<AllowedTransitionsDto>> {
    const requirement = await this.requirementsService.findById(id);
    const allowedTransitions =
      await this.requirementStateService.getAllowedTransitions(requirement.status);
    return { code: 0, data: { allowedTransitions } };
  }

  @Get('requirements/:id/change-history')
  async getChangeHistory(@Param('id') id: string): Promise<ApiResponse<ChangeHistoryResponseDto>> {
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

  @Post('requirements/:id/review')
  async reviewRequirement(
    @Param('id') id: string,
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

  @Post('requirements/generate')
  async generateRequirementsFromRaw(
    @Body('rawRequirementId') rawRequirementId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<RequirementResponseDto[]>> {
    const user = req.user as { id?: string; userId?: string };
    const userId = user.id || user.userId;
    
    // 获取原始需求
    const rawRequirement = await this.rawRequirementService.getRawRequirementById(rawRequirementId);
    if (!rawRequirement) {
      return { code: 404, message: '原始需求不存在' };
    }
    
    // 调用 AI 服务生成结构化需求（不持久化）
    const result = await this.aiGenerationService.generateRequirements(
      rawRequirement.projectId,
      rawRequirement.content,
      userId!,
      undefined, // context
      undefined, // moduleIds
      false, // 不持久化
    );
    
    // 转换为响应 DTO
    const requirements = result.requirements.map(req => ({
      id: req.id,
      moduleId: req.moduleId,
      moduleIds: req.moduleIds,
      title: req.title,
      description: req.description,
      priority: req.priority,
      source: req.source,
      status: req.status,
      storyPoints: req.storyPoints,
      parentId: req.parentId,
      createdById: req.createdById,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
    }));
    
    return { code: 0, data: requirements };
  }

  @Post('requirements/batch')
  async batchCreateRequirements(
    @Body('requirements') requirements: CreateRequirementDto[],
    @Body('moduleId') moduleId: string,
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