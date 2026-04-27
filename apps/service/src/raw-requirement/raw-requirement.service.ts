import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RawRequirement, QuestionAndAnswer } from "@req2task/core";
import {
  RawRequirementResponseDto,
  RawRequirementStatus,
  QuestionAndAnswerDto,
  CollectionType,
  CreateRawRequirementDto,
  UpdateRawRequirementDto,
  RawRequirementListParams,
  AttachmentTargetType,
} from "@req2task/dto";
import { ProjectAttachmentService } from "../project-attachment/project-attachment.service";

export interface AddRawRequirementDto {
  projectId: string;
  content: string;
  source?: string;
  collectionType?: CollectionType;
  collectTime?: string;
  userId: string;
}

@Injectable()
export class RawRequirementService {
  async create(
    projectId: string,
    dto: CreateRawRequirementDto,
    userId: string,
  ): Promise<RawRequirementResponseDto> {
    const rawRequirement = this.rawRequirementRepository.create({
      projectId,
      collectionType: dto.collectionType || null,
      originalContent: dto.content,
      source: dto.source || null,
      collectTime: dto.collectTime ? new Date(dto.collectTime) : null,
      status: RawRequirementStatus.PENDING,
      createdById: userId,
      questionAndAnswers: [],
      keyElements: [],
    });

    const saved = await this.rawRequirementRepository.save(rawRequirement);

    if (dto.fileIds && dto.fileIds.length > 0) {
      for (const fileDataId of dto.fileIds) {
        try {
          await this.projectAttachmentService.createByFileDataId(
            projectId,
            {
              fileDataId,
              targetType: AttachmentTargetType.PROJECT,
              targetId: saved.id,
              fileName: "",
              contentType: "",
              size: 0,
              projectId: projectId,
            },
            userId,
          );
        } catch (error) {
          this.logger.error(
            `Failed to create attachment for file ${fileDataId}:`,
            error,
          );
        }
      }
    }

    return this.toRawRequirementResponseDto(saved);
  }
  private readonly logger = new Logger(RawRequirementService.name);

  constructor(
    @InjectRepository(RawRequirement)
    private readonly rawRequirementRepository: Repository<RawRequirement>,
    private readonly projectAttachmentService: ProjectAttachmentService,
  ) {}

  private toQuestionAndAnswerDtos(
    questionAndAnswers: QuestionAndAnswer[] | null,
  ): QuestionAndAnswerDto[] {
    if (!questionAndAnswers) return [];
    return questionAndAnswers.map((qa) => ({
      id: qa.id,
      question: qa.question,
      answer: qa.answer,
      purpose: qa.purpose,
      createdAt: qa.createdAt,
      answeredAt: qa.answeredAt,
    }));
  }

  private toRawRequirementResponseDto(
    entity: RawRequirement,
  ): RawRequirementResponseDto {
    return {
      id: entity.id,
      projectId: entity.projectId,
      collectionType: entity.collectionType || undefined,
      conversationId: entity.conversationId || undefined,
      content: entity.originalContent,
      source: entity.source || "",
      collectTime: entity.collectTime ? entity.collectTime.toISOString() : null,
      status: entity.status,
      questionAndAnswers: this.toQuestionAndAnswerDtos(
        entity.questionAndAnswers,
      ),
      keyElements: entity.keyElements || [],
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  async addRawRequirement(
    dto: AddRawRequirementDto,
  ): Promise<RawRequirementResponseDto> {
    const rawRequirement = this.rawRequirementRepository.create({
      projectId: dto.projectId,
      collectionType: dto.collectionType || null,
      originalContent: dto.content,
      source: dto.source || null,
      collectTime: dto.collectTime ? new Date(dto.collectTime) : null,
      status: RawRequirementStatus.PENDING,
      createdById: dto.userId,
      questionAndAnswers: [],
      keyElements: [],
    });

    const saved = await this.rawRequirementRepository.save(rawRequirement);
    return this.toRawRequirementResponseDto(saved);
  }

  async updateRawRequirement(
    rawRequirementId: string,
    updates: UpdateRawRequirementDto,
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

  async getRawRequirementsByProject(
    projectId: string,
    params: RawRequirementListParams = {},
  ): Promise<RawRequirementResponseDto[]> {
    const { page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.rawRequirementRepository
      .createQueryBuilder("rawRequirement")
      .where("rawRequirement.projectId = :projectId", { projectId })
      .orderBy("rawRequirement.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    if (status) {
      queryBuilder.andWhere("rawRequirement.status = :status", { status });
    }

    const rawRequirements = await queryBuilder.getMany();
    return rawRequirements.map((r) => this.toRawRequirementResponseDto(r));
  }

  async getQuestionAndAnswers(
    rawRequirementId: string,
  ): Promise<QuestionAndAnswerDto[]> {
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
