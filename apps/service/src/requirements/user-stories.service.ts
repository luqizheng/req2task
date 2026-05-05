import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStory, AcceptanceCriteria } from '@req2task/core';
import {
  CreateUserStoryDto,
  UpdateUserStoryDto,
  UserStoryResponseDto,
  UserStoryDraftDto,
  CriteriaType,
} from '@req2task/dto';
import { AcceptanceCriteriaService } from './acceptance-criteria.service';

@Injectable()
export class UserStoriesService {
  constructor(
    @InjectRepository(UserStory) private userStoryRepository: Repository<UserStory>,
    private acceptanceCriteriaService: AcceptanceCriteriaService,
  ) {}

  async create(
    requirementId: string,
    createDto: CreateUserStoryDto,
  ): Promise<UserStoryResponseDto> {
    const userStory = this.userStoryRepository.create({
      requirementId,
      role: createDto.role,
      goal: createDto.goal,
      benefit: createDto.benefit,
      storyPoints: createDto.storyPoints || 0,
    });

    const saved = await this.userStoryRepository.save(userStory);
    return this.toResponseDto(saved);
  }

  async findByRequirement(requirementId: string): Promise<UserStoryResponseDto[]> {
    const userStories = await this.userStoryRepository.find({
      where: { requirementId },
      relations: ['acceptanceCriteria'],
      order: { createdAt: 'DESC' },
    });

    return userStories.map((us) => this.toResponseDto(us));
  }

  async update(
    id: string,
    updateDto: UpdateUserStoryDto,
  ): Promise<UserStoryResponseDto> {
    const userStory = await this.userStoryRepository.findOne({
      where: { id },
      relations: ['acceptanceCriteria'],
    });

    if (!userStory) {
      throw new NotFoundException(`UserStory with ID ${id} not found`);
    }

    if (updateDto.role !== undefined) userStory.role = updateDto.role;
    if (updateDto.goal !== undefined) userStory.goal = updateDto.goal;
    if (updateDto.benefit !== undefined) userStory.benefit = updateDto.benefit;
    if (updateDto.storyPoints !== undefined) userStory.storyPoints = updateDto.storyPoints;

    const updated = await this.userStoryRepository.save(userStory);
    return this.toResponseDto(updated);
  }

  async delete(id: string): Promise<void> {
    const userStory = await this.userStoryRepository.findOne({ where: { id } });
    if (!userStory) {
      throw new NotFoundException(`UserStory with ID ${id} not found`);
    }
    await this.userStoryRepository.remove(userStory);
  }

  async createFromDrafts(
    requirementId: string,
    drafts: UserStoryDraftDto[],
  ): Promise<UserStoryResponseDto[]> {
    const results: UserStoryResponseDto[] = [];

    for (const draft of drafts) {
      const userStory = this.userStoryRepository.create({
        requirementId,
        role: draft.role,
        goal: draft.goal,
        benefit: draft.benefit,
        storyPoints: draft.storyPoints || 0,
      });

      const saved = await this.userStoryRepository.save(userStory);

      if (draft.acceptanceCriteria && draft.acceptanceCriteria.length > 0) {
        const criteria: Partial<AcceptanceCriteria>[] = draft.acceptanceCriteria.map(
          (c) => ({
            userStoryId: saved.id,
            criteriaType: (c.criteriaType as CriteriaType) || CriteriaType.FUNCTIONAL,
            content: c.content,
            testMethod: c.testMethod || null,
          }),
        );
        await this.acceptanceCriteriaService.createMany(criteria);
      }

      const withCriteria = await this.userStoryRepository.findOne({
        where: { id: saved.id },
        relations: ['acceptanceCriteria'],
      });

      if (withCriteria) {
        results.push(this.toResponseDto(withCriteria));
      }
    }

    return results;
  }

  async findById(id: string): Promise<UserStory> {
    const userStory = await this.userStoryRepository.findOne({ where: { id } });
    if (!userStory) {
      throw new NotFoundException(`UserStory with ID ${id} not found`);
    }
    return userStory;
  }

  private toResponseDto(userStory: UserStory): UserStoryResponseDto {
    const dto: UserStoryResponseDto = {
      id: userStory.id,
      requirementId: userStory.requirementId,
      role: userStory.role,
      goal: userStory.goal,
      benefit: userStory.benefit,
      storyPoints: userStory.storyPoints,
      createdAt: userStory.createdAt,
      updatedAt: userStory.updatedAt,
    };

    if (userStory.acceptanceCriteria) {
      dto.acceptanceCriteria = userStory.acceptanceCriteria.map((c) =>
        this.acceptanceCriteriaService.toResponseDto(c),
      );
    }

    return dto;
  }
}