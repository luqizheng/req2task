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
import { FeatureModulesService } from './feature-modules.service';
import { AiGenerationService } from '../ai/ai-generation.service';
import {
  CreateFeatureModuleDto,
  UpdateFeatureModuleDto,
  FeatureModuleResponseDto,
  FeatureModuleListResponseDto,
  RecommendModuleDto,
  ModuleRecommendResponseDto,
  CreateModuleFromRecommendationDto,
  GenerateModulesDto,
} from '@req2task/dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    id?: string;
  };
}

@Controller('feature-modules')
@UseGuards(JwtAuthGuard)
export class FeatureModulesController {
  constructor(
    private readonly featureModulesService: FeatureModulesService,
    private readonly aiGenerationService: AiGenerationService,
  ) {}

  @Get()
  async findByProject(
    @Query('projectId') projectId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<FeatureModuleListResponseDto> {
    return this.featureModulesService.findByProject(projectId, parseInt(page), parseInt(limit));
  }

  @Get('tree/:projectId')
  async findTreeByProject(
    @Param('projectId') projectId: string,
  ): Promise<FeatureModuleResponseDto[]> {
    return this.featureModulesService.findTreeByProject(projectId);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<FeatureModuleResponseDto> {
    return this.featureModulesService.findById(id);
  }

  @Post()
  async create(@Body() createDto: CreateFeatureModuleDto): Promise<FeatureModuleResponseDto> {
    return this.featureModulesService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateFeatureModuleDto,
  ): Promise<FeatureModuleResponseDto> {
    return this.featureModulesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.featureModulesService.delete(id);
  }

  @Post('recommend/:projectId')
  async recommendModules(
    @Param('projectId') projectId: string,
    @Body() recommendDto: RecommendModuleDto,
  ): Promise<ModuleRecommendResponseDto> {
    const recommendations = await this.featureModulesService.recommendModules(
      projectId,
      recommendDto.content,
    );
    return { recommendations };
  }

  @Post('create-from-recommendation')
  async createFromRecommendation(
    @Body() createDto: CreateModuleFromRecommendationDto,
  ): Promise<FeatureModuleResponseDto> {
    return this.featureModulesService.createFromRecommendation({
      name: createDto.name,
      description: createDto.description,
      projectId: createDto.projectId,
      parentId: createDto.parentId,
      aliases: createDto.aliases,
      keywords: createDto.keywords,
    });
  }

  @Post('projects/:projectId/ai-generate-modules')
  @HttpCode(HttpStatus.CREATED)
  async generateModules(
    @Param('projectId') projectId: string,
    @Body() dto: GenerateModulesDto,
    @Request() req: AuthenticatedRequest,
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
        modules: result.modules.map((m) => ({
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
