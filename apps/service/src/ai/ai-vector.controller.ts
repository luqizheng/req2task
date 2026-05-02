import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirementVectorService } from './requirement-vector.service';
import { RebuildVectorRequestDto, RebuildVectorResponseDto } from '@req2task/dto';

@Controller('llm/vector')
@UseGuards(AuthGuard('jwt'))
export class AiVectorController {
  private readonly logger = new Logger(AiVectorController.name);

  constructor(private readonly vectorService: RequirementVectorService) {}

  @Post('rebuild')
  async rebuildVector(
    @Body() dto: RebuildVectorRequestDto,
  ): Promise<RebuildVectorResponseDto> {
    this.logger.warn(`Starting vector rebuild${dto.projectId ? ` for project ${dto.projectId}` : ' for all projects'}`);

    try {
      const result = await this.vectorService.rebuildAll(dto.projectId);

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
}
