import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserStoriesService } from './user-stories.service';
import {
  CreateUserStoryDto,
  UpdateUserStoryDto,
  UserStoryResponseDto,
} from '@req2task/dto';
import { ApiResponse } from '../common';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class UserStoriesController {
  constructor(private readonly userStoriesService: UserStoriesService) {}

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
}