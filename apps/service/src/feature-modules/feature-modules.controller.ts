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
import { FeatureModulesService } from './feature-modules.service';
import {
  CreateFeatureModuleDto,
  UpdateFeatureModuleDto,
  FeatureModuleResponseDto,
  FeatureModuleListResponseDto,
} from '@req2task/dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('feature-modules')
@UseGuards(JwtAuthGuard)
export class FeatureModulesController {
  constructor(private readonly featureModulesService: FeatureModulesService) {}

  @Get()
  async findByProject(
    @Query('projectId') projectId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<FeatureModuleListResponseDto> {
    return this.featureModulesService.findByProject(projectId, parseInt(page), parseInt(limit));
  }

  @Get('tree')
  async findTreeByProject(
    @Query('projectId') projectId: string,
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
}
