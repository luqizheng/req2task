import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Requirement, FeatureModule } from '@req2task/core';
import { EntityKeyService, EntityKeyType } from '../common/services/entity-key.service';
import { RequirementStatus, Priority, RequirementSource } from '@req2task/dto';
import {
  CreateRequirementDto,
  UpdateRequirementDto,
  RequirementResponseDto,
  RequirementListResponseDto,
} from '@req2task/dto';
import { UserStoriesService } from './user-stories.service';
import { AcceptanceCriteriaService } from './acceptance-criteria.service';

@Injectable()
export class RequirementsService {
  constructor(
    @InjectRepository(Requirement) private requirementRepository: Repository<Requirement>,
    @InjectRepository(FeatureModule) private featureModuleRepository: Repository<FeatureModule>,
    private userStoriesService: UserStoriesService,
    private acceptanceCriteriaService: AcceptanceCriteriaService,
    private entityKeyService: EntityKeyService,
  ) {}

  async create(
    moduleId: string | null,
    createDto: CreateRequirementDto,
    createdById: string,
  ): Promise<RequirementResponseDto> {
    let projectId: string | null = null;
    
    if (moduleId) {
      const module = await this.featureModuleRepository.findOne({
        where: { id: moduleId },
        select: ['projectId'],
      });
      projectId = module?.projectId || null;
    }

    const entityKey = projectId 
      ? await this.entityKeyService.generateEntityKey(projectId, EntityKeyType.REQ)
      : null;

    const requirement = this.requirementRepository.create({
      moduleId,
      moduleIds: createDto.moduleIds || null,
      title: createDto.title,
      description: createDto.description || null,
      priority: createDto.priority || Priority.MEDIUM,
      source: createDto.source || RequirementSource.MANUAL,
      status: RequirementStatus.DRAFT,
      parentId: createDto.parentRequirementId || null,
      createdById,
      storyPoints: 0,
      entityKey: entityKey || '',
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

  async findByProject(
    projectId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<RequirementListResponseDto> {
    const modules = await this.featureModuleRepository.find({
      where: { projectId },
      select: ['id'],
    });
    const moduleIds = modules.map((m) => m.id);

    if (moduleIds.length === 0) {
      return { items: [], total: 0, page, limit };
    }

    const [items, total] = await this.requirementRepository.findAndCount({
      where: moduleIds.map((id) => ({ moduleId: id })),
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

  private toResponseDto(requirement: Requirement): RequirementResponseDto {
    const dto: RequirementResponseDto = {
      id: requirement.id,
      entityKey: requirement.entityKey,
      moduleId: requirement.moduleId,
      moduleIds: requirement.moduleIds,
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
      dto.userStories = requirement.userStories.map((us) => ({
        id: us.id,
        requirementId: us.requirementId,
        role: us.role,
        goal: us.goal,
        benefit: us.benefit,
        storyPoints: us.storyPoints,
        createdAt: us.createdAt,
        updatedAt: us.updatedAt,
        acceptanceCriteria: us.acceptanceCriteria?.map((c) =>
          this.acceptanceCriteriaService.toResponseDto(c),
        ),
      }));
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
      entityKey: requirement.entityKey,
      moduleId: requirement.moduleId,
      moduleIds: requirement.moduleIds,
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
}
