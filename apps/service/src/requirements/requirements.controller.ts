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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirementsService } from './requirements.service';
import { RequirementStateService } from '@req2task/core';
import {
  CreateRequirementDto,
  UpdateRequirementDto,
  CreateUserStoryDto,
  UpdateUserStoryDto,
  CreateAcceptanceCriteriaDto,
  UpdateAcceptanceCriteriaDto,
  TransitionStatusDto,
  ReviewRequirementDto,
  RequirementResponseDto,
  RequirementListResponseDto,
  UserStoryResponseDto,
  AcceptanceCriteriaResponseDto,
  ChangeHistoryResponseDto,
  AllowedTransitionsDto,
} from '@req2task/dto';

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
      moduleId,
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

  @Post('user-stories/:requirementId/user-stories')
  async createUserStory(
    @Param('requirementId') requirementId: string,
    @Body() createDto: CreateUserStoryDto,
  ): Promise<ApiResponse<UserStoryResponseDto>> {
    const result = await this.requirementsService.createUserStory(
      requirementId,
      createDto,
    );
    return { code: 0, data: result };
  }

  @Get('user-stories/:requirementId/user-stories')
  async findUserStories(@Param('requirementId') requirementId: string): Promise<ApiResponse<UserStoryResponseDto[]>> {
    const result = await this.requirementsService.findUserStories(requirementId);
    return { code: 0, data: result };
  }

  @Put('user-stories/:id')
  async updateUserStory(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserStoryDto,
  ): Promise<ApiResponse<UserStoryResponseDto>> {
    const result = await this.requirementsService.updateUserStory(id, updateDto);
    return { code: 0, data: result };
  }

  @Delete('user-stories/:id')
  async deleteUserStory(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.requirementsService.deleteUserStory(id);
    return { code: 0, message: '删除成功' };
  }

  @Post('acceptance-criteria/:userStoryId/acceptance-criteria')
  async createAcceptanceCriteria(
    @Param('userStoryId') userStoryId: string,
    @Body() createDto: CreateAcceptanceCriteriaDto,
  ): Promise<ApiResponse<AcceptanceCriteriaResponseDto>> {
    const result = await this.requirementsService.createAcceptanceCriteria(
      userStoryId,
      createDto,
    );
    return { code: 0, data: result };
  }

  @Get('acceptance-criteria/:userStoryId/acceptance-criteria')
  async findAcceptanceCriteria(@Param('userStoryId') userStoryId: string): Promise<ApiResponse<AcceptanceCriteriaResponseDto[]>> {
    const result = await this.requirementsService.findAcceptanceCriteria(userStoryId);
    return { code: 0, data: result };
  }

  @Put('acceptance-criteria/:id')
  async updateAcceptanceCriteria(
    @Param('id') id: string,
    @Body() updateDto: UpdateAcceptanceCriteriaDto,
  ): Promise<ApiResponse<AcceptanceCriteriaResponseDto>> {
    const result = await this.requirementsService.updateAcceptanceCriteria(id, updateDto);
    return { code: 0, data: result };
  }

  @Delete('acceptance-criteria/:id')
  async deleteAcceptanceCriteria(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.requirementsService.deleteAcceptanceCriteria(id);
    return { code: 0, message: '删除成功' };
  }
}
