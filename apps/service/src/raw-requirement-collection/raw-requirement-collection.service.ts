import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RawRequirementCollection,
  RawRequirement,
} from '@req2task/core';
import {
  CreateRawRequirementCollectionDto,
  UpdateRawRequirementCollectionDto,
  RawRequirementStatus,
} from '@req2task/dto';
import { ChatMessage } from '@req2task/core';

@Injectable()
export class RawRequirementCollectionService {
  private readonly logger = new Logger(RawRequirementCollectionService.name);

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

  async addRawRequirement(
    collectionId: string,
    content: string,
    source: string,
    userId: string,
    moduleId: string,
  ): Promise<RawRequirement> {
    const collection = await this.findById(collectionId);

    const rawRequirement = this.rawRequirementRepository.create({
      collectionId: collection.id,
      moduleId,
      originalContent: content,
      source,
      status: RawRequirementStatus.PENDING,
      createdById: userId,
      sessionHistory: [],
      followUpQuestions: [],
      keyElements: [],
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
}
