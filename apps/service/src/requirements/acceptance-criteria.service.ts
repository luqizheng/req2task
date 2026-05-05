import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcceptanceCriteria } from '@req2task/core';
import {
  CreateAcceptanceCriteriaDto,
  UpdateAcceptanceCriteriaDto,
  AcceptanceCriteriaResponseDto,
} from '@req2task/dto';

@Injectable()
export class AcceptanceCriteriaService {
  constructor(
    @InjectRepository(AcceptanceCriteria) private acceptanceCriteriaRepository: Repository<AcceptanceCriteria>,
  ) {}

  async create(
    userStoryId: string,
    createDto: CreateAcceptanceCriteriaDto,
  ): Promise<AcceptanceCriteriaResponseDto> {
    const criteria = this.acceptanceCriteriaRepository.create({
      userStoryId,
      criteriaType: createDto.criteriaType,
      content: createDto.content,
      testMethod: createDto.testMethod || null,
    });

    const saved = await this.acceptanceCriteriaRepository.save(criteria);
    return this.toResponseDto(saved);
  }

  async createMany(criteriaList: Partial<AcceptanceCriteria>[]): Promise<void> {
    if (!criteriaList || criteriaList.length === 0) return;
    await this.acceptanceCriteriaRepository.save(criteriaList as AcceptanceCriteria[]);
  }

  async findByUserStory(userStoryId: string): Promise<AcceptanceCriteriaResponseDto[]> {
    const criteriaList = await this.acceptanceCriteriaRepository.find({
      where: { userStoryId },
      order: { createdAt: 'DESC' },
    });

    return criteriaList.map((c) => this.toResponseDto(c));
  }

  async update(
    id: string,
    updateDto: UpdateAcceptanceCriteriaDto,
  ): Promise<AcceptanceCriteriaResponseDto> {
    const criteria = await this.acceptanceCriteriaRepository.findOne({ where: { id } });

    if (!criteria) {
      throw new NotFoundException(`AcceptanceCriteria with ID ${id} not found`);
    }

    if (updateDto.criteriaType !== undefined) criteria.criteriaType = updateDto.criteriaType;
    if (updateDto.content !== undefined) criteria.content = updateDto.content;
    if (updateDto.testMethod !== undefined) criteria.testMethod = updateDto.testMethod;

    const updated = await this.acceptanceCriteriaRepository.save(criteria);
    return this.toResponseDto(updated);
  }

  async delete(id: string): Promise<void> {
    const criteria = await this.acceptanceCriteriaRepository.findOne({ where: { id } });
    if (!criteria) {
      throw new NotFoundException(`AcceptanceCriteria with ID ${id} not found`);
    }
    await this.acceptanceCriteriaRepository.remove(criteria);
  }

  toResponseDto(criteria: AcceptanceCriteria): AcceptanceCriteriaResponseDto {
    return {
      id: criteria.id,
      userStoryId: criteria.userStoryId,
      criteriaType: criteria.criteriaType,
      content: criteria.content,
      testMethod: criteria.testMethod,
      createdAt: criteria.createdAt,
      updatedAt: criteria.updatedAt,
    };
  }
}