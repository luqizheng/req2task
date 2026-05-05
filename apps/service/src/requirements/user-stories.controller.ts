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
  SaveUserStoriesDto,
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

  @Post('requirements/:requirementId/user-stories/preview')
  @HttpCode(HttpStatus.OK)
  async previewUserStories(
    @Param('requirementId') requirementId: string,
  ): Promise<ApiResponse<{
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
  }>> {
    const result = await this.aiGenerationService.generateUserStoriesOnly(
      requirementId,
    );

    return {
      code: 0,
      data: result,
    };
  }

  @Post('requirements/:requirementId/user-stories/save')
  @HttpCode(HttpStatus.CREATED)
  async saveUserStories(
    @Param('requirementId') requirementId: string,
    @Body() dto: SaveUserStoriesDto,
  ): Promise<ApiResponse<{ userStories: UserStoryResponseDto[] }>> {
    const savedUserStories = await this.userStoriesService.createFromDrafts(
      requirementId,
      dto.userStories,
    );

    return {
      code: 0,
      data: {
        userStories: savedUserStories,
      },
    };
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
      projectId,
      createdById,
      dto.context,
      dto.featurePoints,
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
          updatedAt: us.updatedAt,
        })),
        rawContent: result.rawContent,
      },
    };
  }
}