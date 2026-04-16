import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Requirement,
  RequirementStatus,
  Priority,
  RequirementSource,
  UserStory,
  AcceptanceCriteria,
} from '@req2task/core';
import {
  CreateRequirementDto,
  UpdateRequirementDto,
  RequirementResponseDto,
  RequirementListResponseDto,
  CreateUserStoryDto,
  UpdateUserStoryDto,
  UserStoryResponseDto,
  CreateAcceptanceCriteriaDto,
  UpdateAcceptanceCriteriaDto,
  AcceptanceCriteriaResponseDto,
} from '@req2task/dto';

@Injectable()
export class RequirementsService {
  constructor(
    @InjectRepository(Requirement)
    private requirementRepository: Repository<Requirement>,
    @InjectRepository(UserStory)
    private userStoryRepository: Repository<UserStory>,
    @InjectRepository(AcceptanceCriteria)
    private acceptanceCriteriaRepository: Repository<AcceptanceCriteria>,
  ) {}

  async create(
    moduleId: string,
    createDto: CreateRequirementDto,
    createdById: string,
  ): Promise<RequirementResponseDto> {
    const requirement = this.requirementRepository.create({
      moduleId,
      title: createDto.title,
      description: createDto.description || null,
      priority: createDto.priority || Priority.MEDIUM,
      source: createDto.source || RequirementSource.MANUAL,
      status: RequirementStatus.DRAFT,
      parentId: createDto.parentRequirementId || null,
      createdById,
      storyPoints: 0,
    });

    const saved = await this.requirementRepository.save(requirement);
    return this.toResponseDto(saved);
  }

  async findByModule(
    moduleId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<RequirementListResponseDto> {
    const [items, total] = await this.requirementRepository.findAndCount({
      where: { moduleId },
      relations: ['createdBy', 'userStories', 'children'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items: items.map((r) => this.toListItemDto(r)),
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<RequirementResponseDto> {
    const requirement = await this.requirementRepository.findOne({
      where: { id },
      relations: [
        'createdBy',
        'userStories',
        'userStories.acceptanceCriteria',
        'children',
        'parent',
        'module',
      ],
    });

    if (!requirement) {
      throw new NotFoundException(`Requirement with ID ${id} not found`);
    }

    return this.toResponseDto(requirement);
  }

  async update(
    id: string,
    updateDto: UpdateRequirementDto,
  ): Promise<RequirementResponseDto> {
    const requirement = await this.requirementRepository.findOne({
      where: { id },
      relations: ['createdBy', 'userStories', 'userStories.acceptanceCriteria', 'children'],
    });

    if (!requirement) {
      throw new NotFoundException(`Requirement with ID ${id} not found`);
    }

    if (updateDto.title !== undefined) requirement.title = updateDto.title;
    if (updateDto.description !== undefined) requirement.description = updateDto.description;
    if (updateDto.priority !== undefined) requirement.priority = updateDto.priority;
    if (updateDto.status !== undefined) requirement.status = updateDto.status;
    if (updateDto.storyPoints !== undefined) requirement.storyPoints = updateDto.storyPoints;

    const updated = await this.requirementRepository.save(requirement);
    return this.toResponseDto(updated);
  }

  async delete(id: string): Promise<void> {
    const requirement = await this.requirementRepository.findOne({ where: { id } });
    if (!requirement) {
      throw new NotFoundException(`Requirement with ID ${id} not found`);
    }
    await this.requirementRepository.remove(requirement);
  }

  async createUserStory(
    requirementId: string,
    createDto: CreateUserStoryDto,
  ): Promise<UserStoryResponseDto> {
    const requirement = await this.requirementRepository.findOne({ where: { id: requirementId } });
    if (!requirement) {
      throw new NotFoundException(`Requirement with ID ${requirementId} not found`);
    }

    const userStory = this.userStoryRepository.create({
      requirementId,
      role: createDto.role,
      goal: createDto.goal,
      benefit: createDto.benefit,
      storyPoints: createDto.storyPoints || 0,
    });

    const saved = await this.userStoryRepository.save(userStory);
    return this.toUserStoryResponseDto(saved);
  }

  async findUserStories(requirementId: string): Promise<UserStoryResponseDto[]> {
    const userStories = await this.userStoryRepository.find({
      where: { requirementId },
      relations: ['acceptanceCriteria'],
      order: { createdAt: 'DESC' },
    });

    return userStories.map((us) => this.toUserStoryResponseDto(us));
  }

  async updateUserStory(
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
    return this.toUserStoryResponseDto(updated);
  }

  async deleteUserStory(id: string): Promise<void> {
    const userStory = await this.userStoryRepository.findOne({ where: { id } });
    if (!userStory) {
      throw new NotFoundException(`UserStory with ID ${id} not found`);
    }
    await this.userStoryRepository.remove(userStory);
  }

  async createAcceptanceCriteria(
    userStoryId: string,
    createDto: CreateAcceptanceCriteriaDto,
  ): Promise<AcceptanceCriteriaResponseDto> {
    const userStory = await this.userStoryRepository.findOne({ where: { id: userStoryId } });
    if (!userStory) {
      throw new NotFoundException(`UserStory with ID ${userStoryId} not found`);
    }

    const criteria = this.acceptanceCriteriaRepository.create({
      userStoryId,
      criteriaType: createDto.criteriaType,
      content: createDto.content,
      testMethod: createDto.testMethod || null,
    });

    const saved = await this.acceptanceCriteriaRepository.save(criteria);
    return this.toAcceptanceCriteriaResponseDto(saved);
  }

  async findAcceptanceCriteria(userStoryId: string): Promise<AcceptanceCriteriaResponseDto[]> {
    const criteriaList = await this.acceptanceCriteriaRepository.find({
      where: { userStoryId },
      order: { createdAt: 'DESC' },
    });

    return criteriaList.map((c) => this.toAcceptanceCriteriaResponseDto(c));
  }

  async updateAcceptanceCriteria(
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
    return this.toAcceptanceCriteriaResponseDto(updated);
  }

  async deleteAcceptanceCriteria(id: string): Promise<void> {
    const criteria = await this.acceptanceCriteriaRepository.findOne({ where: { id } });
    if (!criteria) {
      throw new NotFoundException(`AcceptanceCriteria with ID ${id} not found`);
    }
    await this.acceptanceCriteriaRepository.remove(criteria);
  }

  private toResponseDto(requirement: Requirement): RequirementResponseDto {
    const dto: RequirementResponseDto = {
      id: requirement.id,
      moduleId: requirement.moduleId,
      title: requirement.title,
      description: requirement.description,
      priority: requirement.priority,
      source: requirement.source,
      status: requirement.status,
      storyPoints: requirement.storyPoints,
      parentId: requirement.parentId,
      createdById: requirement.createdById,
      createdAt: requirement.createdAt,
      updatedAt: requirement.updatedAt,
    };

    if (requirement.createdBy) {
      dto.createdBy = {
        id: requirement.createdBy.id,
        displayName: requirement.createdBy.displayName,
        username: requirement.createdBy.username,
      };
    }

    if (requirement.userStories) {
      dto.userStories = requirement.userStories.map((us) => this.toUserStoryResponseDto(us));
    }

    if (requirement.children) {
      dto.children = requirement.children.map((c) => ({
        id: c.id,
        title: c.title,
        priority: c.priority,
        status: c.status,
      }));
    }

    return dto;
  }

  private toListItemDto(requirement: Requirement): RequirementResponseDto {
    const dto: RequirementResponseDto = {
      id: requirement.id,
      moduleId: requirement.moduleId,
      title: requirement.title,
      description: requirement.description,
      priority: requirement.priority,
      source: requirement.source,
      status: requirement.status,
      storyPoints: requirement.storyPoints,
      parentId: requirement.parentId,
      createdById: requirement.createdById,
      createdAt: requirement.createdAt,
      updatedAt: requirement.updatedAt,
    };

    if (requirement.createdBy) {
      dto.createdBy = {
        id: requirement.createdBy.id,
        displayName: requirement.createdBy.displayName,
        username: requirement.createdBy.username,
      };
    }

    if (requirement.userStories) {
      dto.userStoryCount = requirement.userStories.length;
    }

    if (requirement.children) {
      dto.childCount = requirement.children.length;
    }

    return dto;
  }

  private toUserStoryResponseDto(userStory: UserStory): UserStoryResponseDto {
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
        this.toAcceptanceCriteriaResponseDto(c),
      );
    }

    return dto;
  }

  private toAcceptanceCriteriaResponseDto(criteria: AcceptanceCriteria): AcceptanceCriteriaResponseDto {
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
