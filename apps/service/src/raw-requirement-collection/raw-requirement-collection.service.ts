import {
  Injectable,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  RawRequirementCollection,
  CollectionStatus,
} from "@req2task/core";
import {
  CreateRawRequirementCollectionDto,
  UpdateRawRequirementCollectionDto,
  CompleteCollectionResultDto,
  RawRequirementCollectionResponseDto,
  RawRequirementCollectionDetailDto,
  RawRequirementStatus,
} from "@req2task/dto";
import { RawRequirementService } from "../raw-requirement/raw-requirement.service";

@Injectable()
export class RawRequirementCollectionService {
  private readonly logger = new Logger(RawRequirementCollectionService.name);

  private toResponseDto(
    entity: RawRequirementCollection,
    rawRequirementCount: number,
    chatRoundCount: number,
  ): RawRequirementCollectionResponseDto {
    return {
      id: entity.id,
      projectId: entity.projectId,
      title: entity.title,
      collectionType: entity.collectionType,
      status: entity.status,
      collectedBy: entity.collectedBy
        ? {
            id: entity.collectedBy.id,
            username: entity.collectedBy.username,
            email: entity.collectedBy.email,
            displayName: entity.collectedBy.displayName,
            role: entity.collectedBy.role,
            createdAt: entity.collectedBy.createdAt,
            updatedAt: entity.collectedBy.updatedAt,
          }
        : undefined!,
      collectedAt: entity.collectedAt.toISOString(),
      completedAt: entity.completedAt?.toISOString(),
      meetingMinutes: entity.meetingMinutes || undefined,
      rawRequirementCount,
      chatRoundCount,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toDetailDto(
    entity: RawRequirementCollection,
    rawRequirementCount: number,
    chatRoundCount: number,
    rawRequirements: any[] = [],
  ): RawRequirementCollectionDetailDto {
    return {
      ...this.toResponseDto(entity, rawRequirementCount, chatRoundCount),
      rawRequirements,
    };
  }

  constructor(
    @InjectRepository(RawRequirementCollection)
    private collectionRepository: Repository<RawRequirementCollection>,
    private readonly rawRequirementService: RawRequirementService,
  ) {}

  async create(
    dto: CreateRawRequirementCollectionDto,
    userId: string,
  ): Promise<RawRequirementCollectionResponseDto> {
    const collection = this.collectionRepository.create({
      projectId: dto.projectId,
      title: dto.title,
      collectionType: dto.collectionType,
      status: CollectionStatus.ACTIVE,
      collectedById: userId,
      collectedAt: dto.collectedAt ? new Date(dto.collectedAt) : new Date(),
      meetingMinutes: dto.meetingMinutes || null,
    });

    const saved = await this.collectionRepository.save(collection);
    return this.toResponseDto(saved, 0, 0);
  }

  async findAllByProject(
    projectId: string,
  ): Promise<RawRequirementCollectionResponseDto[]> {
    const collections = await this.collectionRepository.find({
      where: { projectId },
      relations: ["collectedBy", "rawRequirements"],
      order: { createdAt: "DESC" },
    });

    return collections.map((c) =>
      this.toResponseDto(c, c.rawRequirements?.length || 0, 0),
    );
  }

  async findById(id: string): Promise<RawRequirementCollectionResponseDto> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      relations: ["collectedBy", "rawRequirements", "project"],
    });

    if (!collection) {
      throw new NotFoundException(`Collection ${id} not found`);
    }

    return this.toResponseDto(
      collection,
      collection.rawRequirements?.length || 0,
      0,
    );
  }

  async findByIdWithDetails(
    id: string,
  ): Promise<RawRequirementCollectionDetailDto> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      relations: ["collectedBy", "rawRequirements", "project"],
    });

    if (!collection) {
      throw new NotFoundException(`Collection ${id} not found`);
    }

    const rawRequirements =
      await this.rawRequirementService.getRawRequirements(id);

    const chatRoundCount = rawRequirements.reduce((count, raw) => {
      return (
        count + (raw.questionAndAnswers?.filter((qa) => qa.answer)?.length || 0)
      );
    }, 0);

    return this.toDetailDto(collection, rawRequirements.length, chatRoundCount, rawRequirements);
  }

  async update(
    id: string,
    dto: UpdateRawRequirementCollectionDto,
  ): Promise<RawRequirementCollectionResponseDto> {
    const updateData: Partial<RawRequirementCollection> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.collectionType !== undefined)
      updateData.collectionType = dto.collectionType;
    if (dto.collectedAt !== undefined)
      updateData.collectedAt = new Date(dto.collectedAt);
    if (dto.meetingMinutes !== undefined)
      updateData.meetingMinutes = dto.meetingMinutes;

    await this.collectionRepository.update(id, updateData);

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
    });
    if (!collection) {
      throw new NotFoundException(`Collection ${id} not found`);
    }
    await this.collectionRepository.remove(collection);
  }

  async complete(id: string): Promise<CompleteCollectionResultDto> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      relations: ["collectedBy"],
    });

    if (!collection) {
      throw new NotFoundException(`Collection ${id} not found`);
    }

    if (collection.status === CollectionStatus.COMPLETED) {
      return {
        success: false,
        message: "收集已完成，无法再次完成",
      };
    }

    const rawRequirements =
      await this.rawRequirementService.getRawRequirements(id);

    const unprocessedRequirements = rawRequirements.filter(
      (r) =>
        r.status === RawRequirementStatus.PENDING || r.status === RawRequirementStatus.PROCESSING,
    );

    if (unprocessedRequirements.length > 0) {
      return {
        success: false,
        unclarifiedRequirements: unprocessedRequirements,
        message: `还有 ${unprocessedRequirements.length} 个需求未处理，请先处理或删除`,
      };
    }

    await this.collectionRepository.update(id, {
      status: CollectionStatus.COMPLETED,
      completedAt: new Date(),
    });

    return { success: true };
  }

  async addRawRequirement(
    collectionId: string,
    content: string,
    source: string,
    userId: string,
  ) {
    const isCompleted = await this.rawRequirementService.checkCollectionCompleted(
      collectionId,
    );
    if (isCompleted) {
      throw new Error("收集已完成，无法添加新需求");
    }
    return this.rawRequirementService.addRawRequirement(
      collectionId,
      content,
      source,
      userId,
    );
  }

  async getRawRequirements(collectionId: string) {
    return this.rawRequirementService.getRawRequirements(collectionId);
  }

  async getRawRequirementById(rawRequirementId: string) {
    return this.rawRequirementService.getRawRequirementById(rawRequirementId);
  }

  async deleteRawRequirement(rawRequirementId: string) {
    return this.rawRequirementService.deleteRawRequirement(rawRequirementId);
  }
}
