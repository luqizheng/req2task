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
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserStoriesService } from './user-stories.service';
import {
  CreateUserStoryDto,
  UpdateUserStoryDto,
  UserStoryResponseDto,
  GenerateUserStoriesDto,
} from '@req2task/dto';
import { ApiResponse } from '../common';
import { AiGenerationService } from '../ai/ai-generation.service';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class UserStoriesController {
  constructor(
    private readonly userStoriesService: UserStoriesService,
    private readonly aiGenerationService: AiGenerationService,
  ) {}

  @Post('user-stories/:requirementId/user-stories')
  async createUserStory(
    @Param('requirementId') requirementId: string,
    @Body() createDto: CreateUserStoryDto,
  ): Promise<ApiResponse<UserStoryResponseDto>> {
    const result = await this.userStoriesService.create(
      requirementId,
      createDto,
    );
    return { code: 0, data: result };
  }

  @Get('user-stories/:requirementId/user-stories')
  async findUserStories(@Param('requirementId') requirementId: string): Promise<ApiResponse<UserStoryResponseDto[]>> {
    const result = await this.userStoriesService.findByRequirement(requirementId);
    return { code: 0, data: result };
  }

  @Put('user-stories/:id')
  async updateUserStory(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserStoryDto,
  ): Promise<ApiResponse<UserStoryResponseDto>> {
    const result = await this.userStoriesService.update(id, updateDto);
    return { code: 0, data: result };
  }

  @Delete('user-stories/:id')
  async deleteUserStory(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.userStoriesService.delete(id);
    return { code: 0, message: '删除成功' };
  }

  @Post('requirements/:requirementId/user-stories/generate')
  @HttpCode(HttpStatus.CREATED)
  async generateUserStories(
    @Param('requirementId') requirementId: string,
    @Body() dto: GenerateUserStoriesDto,
    @Query('projectId') projectId: string,
    @Request() req: any,
  ): Promise<ApiResponse<{ userStories: UserStoryResponseDto[]; rawContent: string }>> {
    const createdById = req.user?.id || 'system';

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
}