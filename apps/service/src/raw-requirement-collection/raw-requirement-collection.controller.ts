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
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RawRequirementCollectionService } from './raw-requirement-collection.service';
import { RequirementGenerationService } from '../ai/requirement-generation.service';
import {
  CreateRawRequirementCollectionDto,
  UpdateRawRequirementCollectionDto,
  AddRawRequirementDto,
  ClarifyRawRequirementDto,
} from '@req2task/dto';

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

interface AuthenticatedRequest {
  user: {
    userId: string;
    username: string;
  };
}

@Controller('collections')
@UseGuards(AuthGuard('jwt'))
export class RawRequirementCollectionController {
  constructor(
    private readonly collectionService: RawRequirementCollectionService,
    private readonly requirementGenerationService: RequirementGenerationService,
  ) {}

  @Post()
  async createCollection(
    @Body() dto: CreateRawRequirementCollectionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<unknown>> {
    const user = req.user as { id?: string; userId?: string };
    const userId = user.id || user.userId;
    const result = await this.collectionService.create(dto, userId!);
    return { code: 0, data: result };
  }

  @Get()
  async getCollections(
    @Query('projectId') projectId: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.findAllByProject(projectId);
    return { code: 0, data: result };
  }

  @Get(':id')
  async getCollection(
    @Param('id') id: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.findByIdWithDetails(id);
    return { code: 0, data: result };
  }

  @Put(':id')
  async updateCollection(
    @Param('id') id: string,
    @Body() dto: UpdateRawRequirementCollectionDto,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.update(id, dto);
    return { code: 0, data: result };
  }

  @Delete(':id')
  async deleteCollection(
    @Param('id') id: string,
  ): Promise<ApiResponse<null>> {
    await this.collectionService.delete(id);
    return { code: 0, message: '删除成功' };
  }

  @Post(':id/complete')
  async completeCollection(
    @Param('id') id: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.complete(id);
    return { code: result.success ? 0 : 1, data: result, message: result.message };
  }

  @Post(':id/raw-requirements')
  async addRawRequirement(
    @Param('id') collectionId: string,
    @Body() dto: AddRawRequirementDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<unknown>> {
    const user = req.user as { id?: string; userId?: string };
    const userId = user.id || user.userId;
    const result = await this.collectionService.addRawRequirement(
      collectionId,
      dto.content,
      dto.source,
      userId!,
    );
    return { code: 0, data: result };
  }

  @Get(':id/raw-requirements')
  async getRawRequirements(
    @Param('id') collectionId: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.getRawRequirements(collectionId);
    return { code: 0, data: result };
  }

  @Get('raw-requirements/:rawRequirementId/follow-up-questions')
  async getFollowUpQuestions(
    @Param('rawRequirementId') rawRequirementId: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.getFollowUpQuestions(rawRequirementId);
    return { code: 0, data: result };
  }

  @Get('raw-requirements/:rawRequirementId')
  async getRawRequirement(
    @Param('rawRequirementId') rawRequirementId: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.getRawRequirementById(rawRequirementId);
    return { code: 0, data: result };
  }

  @Post('raw-requirements/:rawRequirementId/chat')
  async chatCollect(
    @Param('rawRequirementId') rawRequirementId: string,
    @Body('message') message: string,
    @Body('configId') configId?: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.requirementGenerationService.chatCollect(
      rawRequirementId,
      message,
      configId,
    );
    return { code: 0, data: result };
  }

  @Post('raw-requirements/:rawRequirementId/clarify')
  async clarifyRawRequirement(
    @Param('rawRequirementId') rawRequirementId: string,
    @Body() dto: ClarifyRawRequirementDto,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.clarifyRawRequirement(
      rawRequirementId,
      dto.clarifiedContent,
    );
    return { code: 0, data: result };
  }

  @Delete('raw-requirements/:rawRequirementId')
  async deleteRawRequirement(
    @Param('rawRequirementId') rawRequirementId: string,
  ): Promise<ApiResponse<null>> {
    await this.collectionService.deleteRawRequirement(rawRequirementId);
    return { code: 0, message: '删除成功' };
  }

  @Post(':id/chat')
  async chatWithCollection(
    @Param('id') collectionId: string,
    @Body('message') message: string,
    @Body('source') source: string,
    @Body('configId') configId: string | undefined,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<unknown>> {
    const user = req.user as { id?: string; userId?: string };
    const userId = user.id || user.userId;

    const rawRequirement = await this.collectionService.addRawRequirement(
      collectionId,
      message,
      source,
      userId!,
    );

    const result = await this.requirementGenerationService.chatCollect(
      rawRequirement.id,
      message,
      configId,
    );

    return {
      code: 0,
      data: {
        rawRequirementId: rawRequirement.id,
        ...result,
      },
    };
  }
}
