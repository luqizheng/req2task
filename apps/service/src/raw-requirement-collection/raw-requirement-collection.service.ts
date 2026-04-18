import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RawRequirementCollection,
  RawRequirement,
  CollectionStatus,
  ChatMessage,
} from '@req2task/core';
import {
  CreateRawRequirementCollectionDto,
  UpdateRawRequirementCollectionDto,
  RawRequirementStatus,
} from '@req2task/dto';

export interface CompleteCollectionResult {
  success: boolean;
  unclarifiedRequirements?: RawRequirement[];
  message?: string;
}

@Injectable()
export class RawRequirementCollectionService {
  private readonly logger = new Logger(RawRequirementCollectionService.name);
  private readonly MAX_QUESTION_COUNT = 5;

  constructor(
    @InjectRepository(RawRequirementCollection)
    private collectionRepository: Repository<RawRequirementCollection>,
    @InjectRepository(RawRequirement)
    private rawRequirementRepository: Repository<RawRequirement>,
  ) {}

  async create(
    dto: CreateRawRequirementCollectionDto,
    userId: string,
  ): Promise<RawRequirementCollection> {
    const collection = this.collectionRepository.create({
      projectId: dto.projectId,
      title: dto.title,
      collectionType: dto.collectionType,
      status: CollectionStatus.ACTIVE,
      collectedById: userId,
      collectedAt: dto.collectedAt ? new Date(dto.collectedAt) : new Date(),
      meetingMinutes: dto.meetingMinutes || null,
    });

    return this.collectionRepository.save(collection);
  }

  async findAllByProject(projectId: string): Promise<RawRequirementCollection[]> {
    return this.collectionRepository.find({
      where: { projectId },
      relations: ['collectedBy', 'rawRequirements'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<RawRequirementCollection> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      relations: ['collectedBy', 'rawRequirements', 'project'],
    });

    if (!collection) {
      throw new NotFoundException(`Collection ${id} not found`);
    }

    return collection;
  }

  async findByIdWithDetails(id: string): Promise<RawRequirementCollection & { rawRequirementCount: number; chatRoundCount: number }> {
    const collection = await this.findById(id);

    const rawRequirements = await this.rawRequirementRepository.find({
      where: { collectionId: id },
    });

    const chatRoundCount = rawRequirements.reduce((count, raw) => {
      return count + (raw.sessionHistory?.length || 0) / 2;
    }, 0);

    return {
      ...collection,
      rawRequirementCount: rawRequirements.length,
      chatRoundCount: Math.floor(chatRoundCount),
    };
  }

  async update(
    id: string,
    dto: UpdateRawRequirementCollectionDto,
  ): Promise<RawRequirementCollection> {
    const updateData: Partial<RawRequirementCollection> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.collectionType !== undefined) updateData.collectionType = dto.collectionType;
    if (dto.collectedAt !== undefined) updateData.collectedAt = new Date(dto.collectedAt);
    if (dto.meetingMinutes !== undefined) updateData.meetingMinutes = dto.meetingMinutes;

    await this.collectionRepository.update(id, updateData);

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const collection = await this.findById(id);
    await this.collectionRepository.remove(collection);
  }

  async complete(id: string): Promise<CompleteCollectionResult> {
    const collection = await this.findById(id);

    if (collection.status === CollectionStatus.COMPLETED) {
      return {
        success: false,
        message: '收集已完成，无法再次完成',
      };
    }

    const rawRequirements = await this.rawRequirementRepository.find({
      where: { collectionId: id },
    });

    const unclarifiedRequirements = rawRequirements.filter(
      (r) => r.status !== RawRequirementStatus.CONVERTED && r.status !== RawRequirementStatus.DISCARDED
    );

    if (unclarifiedRequirements.length > 0) {
      return {
        success: false,
        unclarifiedRequirements,
        message: `还有 ${unclarifiedRequirements.length} 个需求未澄清，请先澄清或删除`,
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
  ): Promise<RawRequirement> {
    const collection = await this.findById(collectionId);

    if (collection.status === CollectionStatus.COMPLETED) {
      throw new BadRequestException('收集已完成，无法添加新需求');
    }

    const rawRequirement = this.rawRequirementRepository.create({
      collectionId: collection.id,
      originalContent: content,
      source,
      status: RawRequirementStatus.PENDING,
      createdById: userId,
      sessionHistory: [],
      followUpQuestions: [],
      keyElements: [],
      questionCount: 0,
    });

    return this.rawRequirementRepository.save(rawRequirement);
  }

  async updateRawRequirement(
    rawRequirementId: string,
    updates: {
      status?: RawRequirementStatus;
      generatedContent?: string;
      sessionHistory?: ChatMessage[];
      followUpQuestions?: string[];
      keyElements?: string[];
      questionCount?: number;
      clarifiedContent?: string;
      clarifiedAt?: Date;
    },
  ): Promise<RawRequirement> {
    const rawRequirement = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
    });

    if (!rawRequirement) {
      throw new NotFoundException(`Raw requirement ${rawRequirementId} not found`);
    }

    const updateData: Partial<RawRequirement> = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.generatedContent !== undefined) updateData.generatedContent = updates.generatedContent;
    if (updates.sessionHistory !== undefined) updateData.sessionHistory = updates.sessionHistory;
    if (updates.followUpQuestions !== undefined) updateData.followUpQuestions = updates.followUpQuestions;
    if (updates.keyElements !== undefined) updateData.keyElements = updates.keyElements;
    if (updates.questionCount !== undefined) updateData.questionCount = updates.questionCount;
    if (updates.clarifiedContent !== undefined) updateData.clarifiedContent = updates.clarifiedContent;
    if (updates.clarifiedAt !== undefined) updateData.clarifiedAt = updates.clarifiedAt;

    await this.rawRequirementRepository.update(rawRequirementId, updateData);

    return this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
      relations: ['createdBy'],
    }) as Promise<RawRequirement>;
  }

  async getRawRequirements(collectionId: string): Promise<RawRequirement[]> {
    return this.rawRequirementRepository.find({
      where: { collectionId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async getFollowUpQuestions(rawRequirementId: string): Promise<string[]> {
    const rawRequirement = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
    });

    if (!rawRequirement) {
      throw new NotFoundException(`Raw requirement ${rawRequirementId} not found`);
    }

    return rawRequirement.followUpQuestions || [];
  }

  async getRawRequirementById(rawRequirementId: string): Promise<RawRequirement | null> {
    return this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
      relations: ['createdBy'],
    });
  }

  async clarifyRawRequirement(
    rawRequirementId: string,
    clarifiedContent: string,
  ): Promise<RawRequirement> {
    return this.updateRawRequirement(rawRequirementId, {
      status: RawRequirementStatus.CONVERTED,
      clarifiedContent,
      clarifiedAt: new Date(),
    });
  }

  async deleteRawRequirement(rawRequirementId: string): Promise<void> {
    const rawRequirement = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
    });

    if (!rawRequirement) {
      throw new NotFoundException(`Raw requirement ${rawRequirementId} not found`);
    }

    await this.rawRequirementRepository.remove(rawRequirement);
  }

  async getMaxQuestionCount(): Promise<number> {
    return this.MAX_QUESTION_COUNT;
  }

  async incrementQuestionCount(rawRequirementId: string): Promise<number> {
    const rawRequirement = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
    });

    if (!rawRequirement) {
      throw new NotFoundException(`Raw requirement ${rawRequirementId} not found`);
    }

    const newCount = (rawRequirement.questionCount || 0) + 1;
    await this.rawRequirementRepository.update(rawRequirementId, {
      questionCount: newCount,
    });

    return newCount;
  }
}
