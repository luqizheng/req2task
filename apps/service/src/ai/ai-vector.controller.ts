import { Controller, Post, Get, Body, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirementVectorService } from './requirement-vector.service';
import { RebuildVectorRequestDto, RebuildVectorResponseDto, RequirementCheckRequestDto } from '@req2task/dto';

@Controller('vector')
@UseGuards(AuthGuard('jwt'))
export class AiVectorController {
  private readonly logger = new Logger(AiVectorController.name);

  constructor(private readonly vectorService: RequirementVectorService) {}

  @Get('debug')
  async getDebugInfo() {
    try {
      const info = await this.vectorService.getCollectionInfo();
      return { code: 0, data: info };
    } catch (error) {
      return { code: 1, error: String(error) };
    }
  }

  @Post('rebuild')
  async rebuildVector(
    @Body() dto: RebuildVectorRequestDto,
  ): Promise<RebuildVectorResponseDto> {
    this.logger.warn(`Starting vector rebuild${dto.projectId ? ` for project ${dto.projectId}` : ' for all projects'}${dto.clean ? ' (clean mode)' : ''}`);

    try {
      const result = await this.vectorService.rebuildAll(dto.projectId, dto.clean);

      this.logger.warn(`Vector rebuild completed: ${result.requirements} requirements, ${result.rawRequirements} raw requirements`);

      return {
        success: true,
        message: 'Vector store rebuilt successfully',
        data: {
          requirements: result.requirements,
          rawRequirements: result.rawRequirements,
          total: result.requirements + result.rawRequirements,
        },
      };
    } catch (error) {
      this.logger.error('Failed to rebuild vector store', error instanceof Error ? error.stack : String(error));

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  @Post('check')
  async checkRequirements(
    @Body() dto: RequirementCheckRequestDto,
  ): Promise<{
    code: number;
    data: {
      results: Array<{
        requirementId: string;
        hasDuplicate: boolean;
        duplicateRequirements: Array<{ id: string; title: string; description: string; score: number }>;
        hasConflict: boolean;
        conflictDescription?: string;
        conflictRequirements: Array<{ id: string; title: string; description: string; score: number }>;
      }>;
      totalDuplicates: number;
      totalConflicts: number;
    };
  }> {
    this.logger.log(`Checking ${dto.requirements.length} requirements for duplicates/conflicts`);

    try {
      const results = await this.vectorService.checkRequirements(dto.projectId, dto.requirements);

      const totalDuplicates = results.filter((r) => r.hasDuplicate).length;
      const totalConflicts = results.filter((r) => r.hasConflict).length;

      return {
        code: 0,
        data: {
          results,
          totalDuplicates,
          totalConflicts,
        },
      };
    } catch (error) {
      this.logger.error('Failed to check requirements', error instanceof Error ? error.stack : String(error));
      return {
        code: 1,
        data: {
          results: [],
          totalDuplicates: 0,
          totalConflicts: 0,
        },
      };
    }
  }
}
