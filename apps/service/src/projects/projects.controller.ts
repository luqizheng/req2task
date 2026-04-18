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
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { BaselineService } from './baseline.service';
import { ProjectProgressService } from './project-progress.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectResponseDto,
  ProjectListResponseDto,
  AddMemberDto,
  ProjectMemberDto,
  CreateBaselineDto,
  BaselineDto,
  BurndownDataDto,
  ModuleProgressDto,
} from '@req2task/dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@req2task/core';
import { IsString, IsOptional, IsDateString } from 'class-validator';

class BurndownQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly baselineService: BaselineService,
    private readonly projectProgressService: ProjectProgressService,
  ) {}

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<ProjectListResponseDto> {
    return this.projectsService.findAll(parseInt(page), parseInt(limit));
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectsService.findById(id);
  }

  @Get('key/:projectKey')
  async findByKey(@Param('projectKey') projectKey: string): Promise<ProjectResponseDto> {
    return this.projectsService.findByKey(projectKey);
  }

  @Post()
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: User,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(createProjectDto, user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.projectsService.delete(id);
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string): Promise<ProjectMemberDto[]> {
    return this.projectsService.getMembers(id);
  }

  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.addMember(id, addMemberDto);
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.removeMember(id, userId);
  }

  @Get(':id/progress')
  async getProgress(@Param('id') id: string) {
    return this.projectProgressService.getProjectProgress(id);
  }

  @Get(':id/burndown')
  async getBurndown(
    @Param('id') id: string,
    @Query() query: BurndownQueryDto,
  ): Promise<BurndownDataDto> {
    return this.projectProgressService.getDetailedBurndown(id, query);
  }

  @Get('modules/:moduleId/progress')
  async getModuleProgress(@Param('moduleId') moduleId: string): Promise<ModuleProgressDto> {
    return this.projectProgressService.getModuleProgress(moduleId);
  }

  @Post(':id/baselines')
  async createBaseline(
    @Param('id') projectId: string,
    @Body() dto: CreateBaselineDto,
    @CurrentUser() user: User,
  ): Promise<BaselineDto> {
    return this.baselineService.createBaseline(projectId, dto, user.id);
  }

  @Get(':id/baselines')
  async getBaselines(@Param('id') projectId: string): Promise<BaselineDto[]> {
    return this.baselineService.findByProject(projectId);
  }

  @Get('baselines/:baselineId')
  async getBaseline(@Param('baselineId') baselineId: string): Promise<BaselineDto> {
    return this.baselineService.findById(baselineId);
  }

  @Post('baselines/:baselineId/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  async restoreBaseline(@Param('baselineId') baselineId: string): Promise<void> {
    await this.baselineService.restoreBaseline(baselineId);
  }

  @Delete('baselines/:baselineId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBaseline(@Param('baselineId') baselineId: string): Promise<void> {
    await this.baselineService.deleteBaseline(baselineId);
  }

  @Get('baselines/:baselineId1/compare/:baselineId2')
  async compareBaselines(
    @Param('baselineId1') baselineId1: string,
    @Param('baselineId2') baselineId2: string,
  ) {
    return this.baselineService.compareBaselines(baselineId1, baselineId2);
  }
}
