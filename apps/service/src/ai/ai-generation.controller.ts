import { 
  Controller, 
  Post, 
  Body, 
  Param, 
  Query, 
  HttpCode, 
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AiGenerationService } from './ai-generation.service';

interface GenerateRequirementsDto {
  projectId: string;
  rawRequirement: string;
  context?: string;
  moduleIds?: string[];
}

interface GenerateUserStoriesDto {
  featurePoints: string;
  context?: string;
}

interface GenerateTasksDto {
  featurePoints: string;
  context?: string;
}

interface GenerateModulesDto {
  requirements: string;
  context?: string;
  existingModulesTree?: string;
}

@Controller('ai/generation')
export class AiGenerationController {
  constructor(private readonly aiGenerationService: AiGenerationService) {}

  @Post('requirements')
  @HttpCode(HttpStatus.CREATED)
  async generateRequirements(
    @Body() dto: GenerateRequirementsDto,
    @Request() req: any,
  ) {
    const createdById = req.user?.id || 'system';
    
    const result = await this.aiGenerationService.generateRequirements(
      dto.projectId,
      dto.rawRequirement,
      createdById,
      dto.context,
      dto.moduleIds,
    );

    return {
      code: 0,
      data: {
        requirements: result.requirements.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          priority: r.priority,
          status: r.status,
          source: r.source,
          storyPoints: r.storyPoints,
          moduleIds: r.moduleIds,
          parentId: r.parentId,
          createdAt: r.createdAt,
        })),
        rawContent: result.rawContent,
      },
    };
  }

  @Post('user-stories/:requirementId')
  @HttpCode(HttpStatus.CREATED)
  async generateUserStories(
    @Param('requirementId') requirementId: string,
    @Body() dto: GenerateUserStoriesDto,
    @Query('projectId') projectId: string,
    @Request() req: any,
  ) {
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
        userStories: result.userStories.map(us => ({
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

  @Post('tasks/:requirementId')
  @HttpCode(HttpStatus.CREATED)
  async generateTasks(
    @Param('requirementId') requirementId: string,
    @Body() dto: GenerateTasksDto,
    @Query('projectId') projectId: string,
    @Request() req: any,
  ) {
    const createdById = req.user?.id || 'system';
    
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
        tasks: result.tasks.map(t => ({
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

  @Post('modules/:projectId')
  @HttpCode(HttpStatus.CREATED)
  async generateModules(
    @Param('projectId') projectId: string,
    @Body() dto: GenerateModulesDto,
    @Request() req: any,
  ) {
    const createdById = req.user?.id || 'system';
    
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
        modules: result.modules.map(m => ({
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
}
