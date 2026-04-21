import {
  Injectable,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  RawRequirement,
  CollectionStatus,
  QuestionAndAnswer,
} from "@req2task/core";
import {
  RawRequirementResponseDto,
  RawRequirementStatus,
  QuestionAndAnswerDto,
  RawRequirementInCollectionDto,
} from "@req2task/dto";

@Injectable()
export class RawRequirementService {
  private readonly logger = new Logger(RawRequirementService.name);

  constructor(
    @InjectRepository(RawRequirement)
    private readonly rawRequirementRepository: Repository<RawRequirement>,
  ) {}

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

  async addRawRequirement(
    collectionId: string,
    content: string,
    source: string,
    userId: string,
  ): Promise<RawRequirementResponseDto> {
    const rawRequirement = this.rawRequirementRepository.create({
      collectionId,
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

  async checkCollectionCompleted(collectionId: string): Promise<boolean> {
    const collection = await this.rawRequirementRepository.manager
      .getRepository("RawRequirementCollection")
      .findOne({ where: { id: collectionId } });

    if (!collection) {
      throw new NotFoundException(`Collection ${collectionId} not found`);
    }

    return collection.status === CollectionStatus.COMPLETED;
  }
}
