import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WizardService } from '@req2task/core';
import {
  WizardStepDto,
  WizardProgressDto,
  CreateProjectFromWizardDto,
  TechStackSuggestionDto,
  TechStackDto,
  AISuggestionRequestDto,
  AISuggestionResponseDto,
  ProjectResponseDto,
} from '@req2task/dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@req2task/core';
import { ProjectsService } from './projects.service';
import { ProjectStatus } from '@req2task/dto';

@Controller('projects/wizard')
@UseGuards(JwtAuthGuard)
export class WizardController {
  constructor(
    private readonly wizardService: WizardService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get('steps')
  async getWizardSteps(): Promise<WizardStepDto[]> {
    return this.wizardService.getWizardSteps();
  }

  @Get('steps/:stepId')
  async getWizardStep(
    @Param('stepId') stepId: string,
  ): Promise<WizardStepDto | null> {
    return this.wizardService.getWizardStep(stepId);
  }

  @Post('progress')
  async saveProgress(
    @Body() progress: WizardProgressDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.wizardService.saveWizardProgress(progress);
    return this.mapProjectToResponse(project);
  }

  @Get('progress/:projectId')
  async getProgress(
    @Param('projectId') projectId: string,
  ): Promise<WizardProgressDto | null> {
    return this.wizardService.getWizardProgress(projectId);
  }

  @Post('tech-stack-suggestion')
  async getTechStackSuggestion(
    @Body() suggestion: TechStackSuggestionDto,
  ): Promise<TechStackDto> {
    return this.wizardService.suggestTechStack(
      suggestion.systemType,
      suggestion.architectureType,
    );
  }

  @Post('suggest')
  async getAISuggestion(
    @Body() request: AISuggestionRequestDto,
  ): Promise<AISuggestionResponseDto> {
    return this.wizardService.getAISuggestion(request);
  }

  @Post('complete')
  async completeWizard(
    @Body() createDto: CreateProjectFromWizardDto,
    @CurrentUser() user: User,
  ): Promise<ProjectResponseDto> {
    const projectData = {
      name: createDto.name,
      description: createDto.description,
      projectKey: createDto.projectKey,
      status: ProjectStatus.PLANNING,
      systemType: createDto.systemType,
      architectureType: createDto.architectureType,
      techStack: createDto.techStack,
      databaseTypes: createDto.databaseTypes,
      cloudProvider: createDto.cloudProvider,
      securityLevel: createDto.securityLevel,
      projectScale: createDto.projectScale,
      teamSize: createDto.teamSize,
      isMicroservices: createDto.isMicroservices,
      expectedDurationMonths: createDto.expectedDurationMonths,
      budget: createDto.budget,
      businessDomain: createDto.businessDomain,
      targetAudience: createDto.targetAudience,
      wizardCompleted: true,
    };

    const project = await this.projectsService.createFromWizard(
      projectData,
      user.id,
    );

    return this.mapProjectToResponse(project);
  }

  private mapProjectToResponse(project: any): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      projectKey: project.projectKey,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      ownerId: project.ownerId,
      members: (project.members || []).map((m: any) => ({
        id: m.id,
        username: m.username,
        displayName: m.displayName,
        email: m.email,
      })),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      systemType: project.systemType,
      architectureType: project.architectureType,
      techStack: project.techStack,
      databaseTypes: project.databaseTypes,
      cloudProvider: project.cloudProvider,
      securityLevel: project.securityLevel,
      projectScale: project.projectScale,
      teamSize: project.teamSize,
      isMicroservices: project.isMicroservices,
      expectedDurationMonths: project.expectedDurationMonths,
      budget: project.budget,
      businessDomain: project.businessDomain,
      targetAudience: project.targetAudience,
      wizardCompleted: project.wizardCompleted,
    };
  }
}
