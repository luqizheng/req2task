import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Requirement, FeatureModule } from '@req2task/core';
import { EntityKeyService, EntityKeyType } from '../common/services/entity-key.service';
import { RequirementStatus, Priority, RequirementSource } from '@req2task/dto';
import {
  CreateRequirementDto,
  UpdateRequirementDto,
  RequirementResponseDto,
  RequirementListResponseDto,
  ModuleSummaryDto,
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
    const moduleIds = createDto.moduleIds || [];
    if (moduleId) {
      moduleIds.push(moduleId);
    }

    if (moduleIds.length > 0) {
      const modules = await this.featureModuleRepository.findBy({
        id: In(moduleIds),
      });
      projectId = modules[0]?.projectId || null;
    }

    const entityKey = projectId
      ? await this.entityKeyService.generateEntityKey(projectId, EntityKeyType.REQ)
      : '';

    const requirement = this.requirementRepository.create({
      title: createDto.title,
      description: createDto.description || null,
      priority: createDto.priority || Priority.MEDIUM,
      source: createDto.source || RequirementSource.MANUAL,
      status: RequirementStatus.DRAFT,
      parentId: createDto.parentRequirementId || null,
      createdById,
      storyPoints: 0,
      entityKey,
    });

    const saved = await this.requirementRepository.save(requirement);

    if (moduleIds.length > 0) {
      const modules = await this.featureModuleRepository.findBy({
        id: In(moduleIds),
      });
      saved.modules = modules;
      await this.requirementRepository.save(saved);
    }

    return this.findById(saved.id);
  }

  async findByModule(
    moduleId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<RequirementListResponseDto> {
    const query = this.requirementRepository
      .createQueryBuilder('req')
      .innerJoin('req.modules', 'module', 'module.id = :moduleId', { moduleId })
      .leftJoinAndSelect('req.createdBy', 'createdBy')
      .leftJoinAndSelect('req.userStories', 'userStories')
      .leftJoinAndSelect('req.children', 'children')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('req.createdAt', 'DESC');

    const [items, total] = await query.getManyAndCount();

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
    const query = this.requirementRepository
      .createQueryBuilder('req')
      .innerJoin('req.modules', 'module', 'module.projectId = :projectId', { projectId })
      .leftJoinAndSelect('req.createdBy', 'createdBy')
      .leftJoinAndSelect('req.userStories', 'userStories')
      .leftJoinAndSelect('req.children', 'children')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('req.createdAt', 'DESC');

    const [items, total] = await query.getManyAndCount();

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
        'modules',
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
      relations: ['createdBy', 'userStories', 'userStories.acceptanceCriteria', 'children', 'modules'],
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
    return this.findById(updated.id);
  }

  async updateModules(
    id: string,
    moduleIds: string[],
  ): Promise<RequirementResponseDto> {
    const requirement = await this.requirementRepository.findOne({
      where: { id },
      relations: ['modules'],
    });

    if (!requirement) {
      throw new NotFoundException(`Requirement with ID ${id} not found`);
    }

    if (moduleIds.length > 0) {
      const modules = await this.featureModuleRepository.findBy({
        id: In(moduleIds),
      });
      requirement.modules = modules;
    } else {
      requirement.modules = [];
    }

    await this.requirementRepository.save(requirement);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const requirement = await this.requirementRepository.findOne({ where: { id } });
    if (!requirement) {
      throw new NotFoundException(`Requirement with ID ${id} not found`);
    }
    await this.requirementRepository.remove(requirement);
  }

  private toModuleSummaryDto(module: FeatureModule): ModuleSummaryDto {
    return {
      id: module.id,
      name: module.name,
      moduleKey: module.moduleKey,
      path: module.path,
    };
  }

  private toResponseDto(requirement: Requirement): RequirementResponseDto {
    const dto: RequirementResponseDto = {
      id: requirement.id,
      entityKey: requirement.entityKey,
      modules: requirement.modules ? requirement.modules.map((m) => this.toModuleSummaryDto(m)) : [],
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
      modules: requirement.modules ? requirement.modules.map((m) => this.toModuleSummaryDto(m)) : [],
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
