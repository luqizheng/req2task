import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  RawRequirementCollection,
  RawRequirement,
  CollectionStatus,
  QuestionAndAnswer,
} from "@req2task/core";
import {
  CreateRawRequirementCollectionDto,
  UpdateRawRequirementCollectionDto,
  RawRequirementStatus,
  CompleteCollectionResultDto,
  RawRequirementInCollectionDto,
  RawRequirementCollectionResponseDto,
  RawRequirementCollectionDetailDto,
  RawRequirementResponseDto,
  QuestionAndAnswerDto,
} from "@req2task/dto";

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
    rawRequirements: RawRequirement[],
  ): RawRequirementCollectionDetailDto {
    return {
      ...this.toResponseDto(entity, rawRequirementCount, chatRoundCount),
      rawRequirements: rawRequirements.map((r) =>
        this.toRawRequirementInDto(r),
      ),
    };
  }

  private toQuestionAndAnswerDtos(
    questionAndAnswers: QuestionAndAnswer[] | null,
  ): QuestionAndAnswerDto[] {
    if (!questionAndAnswers) return [];
    return questionAndAnswers.map((qa) => ({
      id: qa.id,
      question: qa.question,
      answer: qa.answer,
      createdAt: qa.createdAt,
      answeredAt: qa.answeredAt,
    }));
  }

  private toRawRequirementInDto(
    entity: RawRequirement,
  ): RawRequirementInCollectionDto {
    return {
      id: entity.id,
      content: entity.originalContent,
      status: entity.status,
      questionAndAnswers: this.toQuestionAndAnswerDtos(entity.questionAndAnswers),
      keyElements: entity.keyElements || [],
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toRawRequirementResponseDto(
    entity: RawRequirement,
  ): RawRequirementResponseDto {
    return {
      id: entity.id,
      collectionId: entity.collectionId || "",
      conversationId: entity.conversationId || undefined,
      content: entity.originalContent,
      source: entity.source || "",
      status: entity.status,
      questionAndAnswers: this.toQuestionAndAnswerDtos(entity.questionAndAnswers),
      keyElements: entity.keyElements || [],
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  constructor(
    @InjectRepository(RawRequirementCollection)
    private collectionRepository: Repository<RawRequirementCollection>,
    @InjectRepository(RawRequirement)
    private rawRequirementRepository: Repository<RawRequirement>,
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

    const rawRequirements = await this.rawRequirementRepository.find({
      where: { collectionId: id },
    });

    const chatRoundCount = rawRequirements.reduce((count, raw) => {
      return count + (raw.questionAndAnswers?.filter((qa) => qa.answer)?.length || 0);
    }, 0);

    return this.toDetailDto(
      collection,
      rawRequirements.length,
      chatRoundCount,
      rawRequirements,
    );
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

    const rawRequirements = await this.rawRequirementRepository.find({
      where: { collectionId: id },
    });

    const unprocessedRequirements = rawRequirements.filter(
      (r) =>
        r.status === RawRequirementStatus.PENDING ||
        r.status === RawRequirementStatus.PROCESSING,
    );

    if (unprocessedRequirements.length > 0) {
      const unclarifiedRequirements: RawRequirementInCollectionDto[] =
        unprocessedRequirements.map((r) => ({
          id: r.id,
          content: r.originalContent,
          status: r.status,
          questionAndAnswers: this.toQuestionAndAnswerDtos(r.questionAndAnswers),
          keyElements: r.keyElements || [],
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }));
      return {
        success: false,
        unclarifiedRequirements,
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
  ): Promise<RawRequirementResponseDto> {
    const collection = await this.collectionRepository.findOne({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException(`Collection ${collectionId} not found`);
    }

    if (collection.status === CollectionStatus.COMPLETED) {
      throw new BadRequestException("收集已完成，无法添加新需求");
    }

    const rawRequirement = this.rawRequirementRepository.create({
      collectionId: collection.id,
      originalContent: content,
      source,
      status: RawRequirementStatus.PENDING,
      createdById: userId,
      questionAndAnswers: [],
      keyElements: [],
    });

    const saved = await this.rawRequirementRepository.save(rawRequirement);
    return this.toRawRequirementResponseDto(saved);
  }

  async updateRawRequirement(
    rawRequirementId: string,
    updates: {
      status?: RawRequirementStatus;
      generatedContent?: string;
      questionAndAnswers?: QuestionAndAnswer[];
      keyElements?: string[];
    },
  ): Promise<RawRequirementResponseDto> {
    const rawRequirement = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
    });

    if (!rawRequirement) {
      throw new NotFoundException(
        `Raw requirement ${rawRequirementId} not found`,
      );
    }

    const updateData: Partial<RawRequirement> = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.generatedContent !== undefined)
      updateData.generatedContent = updates.generatedContent;
    if (updates.questionAndAnswers !== undefined)
      updateData.questionAndAnswers = updates.questionAndAnswers;
    if (updates.keyElements !== undefined)
      updateData.keyElements = updates.keyElements;

    await this.rawRequirementRepository.update(rawRequirementId, updateData);

    const updated = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
      relations: ["createdBy"],
    });
    return this.toRawRequirementResponseDto(updated!);
  }

  async getRawRequirements(
    collectionId: string,
  ): Promise<RawRequirementInCollectionDto[]> {
    const rawRequirements = await this.rawRequirementRepository.find({
      where: { collectionId },
      relations: ["createdBy"],
      order: { createdAt: "DESC" },
    });
    return rawRequirements.map((r) => this.toRawRequirementInDto(r));
  }

  async getQuestionAndAnswers(rawRequirementId: string): Promise<QuestionAndAnswerDto[]> {
    const rawRequirement = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
    });

    if (!rawRequirement) {
      throw new NotFoundException(
        `Raw requirement ${rawRequirementId} not found`,
      );
    }

    return this.toQuestionAndAnswerDtos(rawRequirement.questionAndAnswers);
  }

  async getRawRequirementById(
    rawRequirementId: string,
  ): Promise<RawRequirementResponseDto | null> {
    const rawRequirement = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
      relations: ["createdBy"],
    });
    return rawRequirement
      ? this.toRawRequirementResponseDto(rawRequirement)
      : null;
  }

  async deleteRawRequirement(rawRequirementId: string): Promise<void> {
    const rawRequirement = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
    });

    if (!rawRequirement) {
      throw new NotFoundException(
        `Raw requirement ${rawRequirementId} not found`,
      );
    }

    await this.rawRequirementRepository.remove(rawRequirement);
  }
}
