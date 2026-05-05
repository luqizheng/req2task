import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Requirement, FeatureModule } from '@req2task/core';
import { EntityKeyService, EntityKeyType } from '../common/services/entity-key.service';
import { RequirementStatus, Priority, RequirementSource } from '@req2task/dto';
import {
  RequirementDto,
  RequirementResponseDto,
  RequirementListResponseDto,
  ModuleSummaryDto,
  UpdateRequirementDto,
  ConfirmAiModulesDto,
  ConfirmAiModulesResponseDto,
} from '@req2task/dto';
import { AcceptanceCriteriaService } from './acceptance-criteria.service';
import { FeatureModulesService } from '../feature-modules/feature-modules.service';

@Injectable()
export class RequirementsService {
  constructor(
    @InjectRepository(Requirement)
    private requirementRepository: Repository<Requirement>,
    @InjectRepository(FeatureModule)
    private featureModuleRepository: Repository<FeatureModule>,
    private acceptanceCriteriaService: AcceptanceCriteriaService,
    private entityKeyService: EntityKeyService,
    private readonly featureModulesService: FeatureModulesService,
  ) {}

  async saveBatch(
    projectId: string,
    dto: RequirementDto[],
    createdById: string,
  ): Promise<RequirementResponseDto[]> {
    const create = dto.filter((item) => !item.id);
    const update = dto.filter((item) => item.id);
    const entityKeyIds = await this.entityKeyService.generateEntityKey(
      projectId,
      EntityKeyType.REQ,
      create.length,
    );

    const results: RequirementResponseDto[] = [];
    for (const item of create) {
      const entityKey = entityKeyIds.shift() || '';
      const result = await this.create(item, createdById, entityKey, projectId);
      results.push(result);
    }
    for (const item of update) {
      const result = await this.update(item.id, item);
      results.push(result);
    }

    return results;
  }

  async save(dto: RequirementDto, createdById: string): Promise<RequirementResponseDto> {
    if (dto.id) {
      return this.update(dto.id, dto);
    }
    return this.create(dto, createdById);
  }

  private async create(
    createDto: RequirementDto,
    createdById: string,
    entityKeySetting?: string,
    batchProjectId?: string,
  ): Promise<RequirementResponseDto> {
    let projectId: string | null = batchProjectId || null;
    const moduleIds = createDto.moduleIds || [];

    if (moduleIds.length > 0) {
      const modules = await this.featureModuleRepository.findBy({ id: In(moduleIds) });
      projectId = modules[0]?.projectId || batchProjectId || null;
    }

    if (!projectId) {
      throw new Error('无法确定需求所属项目');
    }

    const MAX_RETRIES = 3;
    let saved: Requirement;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const entityKey = await this.entityKeyService.generateEntityKey(
        projectId,
        EntityKeyType.REQ,
      );

      const requirement = this.requirementRepository.create({
        title: createDto.title,
        description: createDto.description || null,
        priority: createDto.priority || Priority.MEDIUM,
        source: createDto.source || RequirementSource.MANUAL,
        status: RequirementStatus.DRAFT,
        parentId: createDto.parentRequirementId || null,
        sourceRawRequirementId: createDto.sourceRawRequirementId || null,
        projectId,
        createdById,
        storyPoints: 0,
        entityKey: entityKey[0],
      });

      try {
        saved = await this.requirementRepository.save(requirement);
        break;
      } catch (error: unknown) {
        const errMsg = String(error);
        const isEntityKeyConflict =
          errMsg.includes('duplicate key') &&
          (errMsg.includes('entity_key') || errMsg.includes('UQ_11df3ea432c3da480886b5033b3'));

        console.warn(
          `[RequirementsService] Attempt ${attempt + 1} failed, isEntityKeyConflict: ${isEntityKeyConflict}, error: ${errMsg.substring(0, 200)}`,
        );

        if (attempt < MAX_RETRIES - 1 && isEntityKeyConflict) {
          continue;
        }
        throw error;
      }
    }

    if (moduleIds.length > 0) {
      const modules = await this.featureModuleRepository.findBy({ id: In(moduleIds) });
      saved!.modules = modules;
      await this.requirementRepository.save(saved!);
    }

    return this.findById(saved!.id);
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
    const [items, total] = await this.requirementRepository.findAndCount({
      where: { projectId },
      relations: ['createdBy', 'userStories', 'children', 'modules'],
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

  async findByRawRequirement(rawRequirementId: string): Promise<RequirementResponseDto[]> {
    const requirements = await this.requirementRepository.find({
      where: { sourceRawRequirementId: rawRequirementId },
      relations: ['createdBy', 'modules'],
      order: { createdAt: 'DESC' },
    });
    return requirements.map((r) => this.toResponseDto(r));
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

  async update(id: string, updateDto: UpdateRequirementDto): Promise<RequirementResponseDto> {
    const requirement = await this.requirementRepository.findOne({
      where: { id },
      relations: [
        'createdBy',
        'userStories',
        'userStories.acceptanceCriteria',
        'children',
        'modules',
      ],
    });

    if (!requirement) {
      throw new NotFoundException(`Requirement with ID ${id} not found`);
    }

    if (updateDto.title !== undefined) requirement.title = updateDto.title;
    if (updateDto.description !== undefined) requirement.description = updateDto.description;
    if (updateDto.featurePoints !== undefined) requirement.featurePoints = updateDto.featurePoints;
    if (updateDto.priority !== undefined) requirement.priority = updateDto.priority;
    if (updateDto.status !== undefined) requirement.status = updateDto.status;
    if (updateDto.storyPoints !== undefined) requirement.storyPoints = updateDto.storyPoints;

    const updated = await this.requirementRepository.save(requirement);
    return this.findById(updated.id);
  }

  async updateModules(id: string, moduleIds: string[]): Promise<RequirementResponseDto> {
    const requirement = await this.requirementRepository.findOne({
      where: { id },
      relations: ['modules'],
    });

    if (!requirement) {
      throw new NotFoundException(`Requirement with ID ${id} not found`);
    }

    requirement.modules =
      moduleIds.length > 0
        ? await this.featureModuleRepository.findBy({ id: In(moduleIds) })
        : [];

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

  private toBaseDto(requirement: Requirement): Partial<RequirementResponseDto> {
    const dto: Partial<RequirementResponseDto> = {
      id: requirement.id,
      entityKey: requirement.entityKey,
      modules: requirement.modules?.map((m) => this.toModuleSummaryDto(m)) || [],
      title: requirement.title,
      description: requirement.description,
      featurePoints: requirement.featurePoints,
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

    return dto;
  }

  private toResponseDto(requirement: Requirement): RequirementResponseDto {
    const dto = this.toBaseDto(requirement) as RequirementResponseDto;

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
    const dto = this.toBaseDto(requirement) as RequirementResponseDto;

    if (requirement.userStories) {
      dto.userStoryCount = requirement.userStories.length;
    }

    if (requirement.children) {
      dto.childCount = requirement.children.length;
    }

    return dto;
  }

  async confirmAiGeneratedModules(
    dto: ConfirmAiModulesDto,
  ): Promise<ConfirmAiModulesResponseDto> {
    const { confirmations, newModules } = dto;

    const needsNewModules = confirmations.some((c) => !c.moduleId);
    if (needsNewModules && (!newModules || newModules.length === 0)) {
      throw new BadRequestException(
        '当有需求需要创建新模块时，必须提供 newModules 信息',
      );
    }

    const createdModules: Array<{ moduleId: string; moduleName: string }> = [];
    const moduleNameToId = new Map<string, string>();

    if (newModules && newModules.length > 0) {
      for (const newModule of newModules) {
        const created = await this.featureModulesService.createFromRecommendation({
          name: newModule.suggestedName,
          description: newModule.suggestedDescription,
          projectId: confirmations[0]?.moduleId
            ? (
                await this.featureModuleRepository.findOne({
                  where: { id: confirmations[0].moduleId },
                })
              )?.projectId || ''
            : '',
          keywords: [newModule.suggestedName],
        });

        moduleNameToId.set(newModule.suggestedName, created.id);
        createdModules.push({
          moduleId: created.id,
          moduleName: created.name,
        });
      }
    }

    const updatedRequirements: Array<{ requirementId: string; moduleId: string }> = [];

    for (const confirmation of confirmations) {
      let targetModuleId = confirmation.moduleId;

      if (!targetModuleId) {
        const confirmationReq = await this.requirementRepository.findOne({
          where: { id: confirmation.requirementId },
        });
        if (!confirmationReq) continue;

        const relatedNewModule = newModules?.find((m) =>
          m.requirementIds.includes(confirmation.requirementId),
        );
        if (relatedNewModule) {
          targetModuleId = moduleNameToId.get(relatedNewModule.suggestedName);
        }
      }

      if (targetModuleId) {
        await this.updateModules(confirmation.requirementId, [targetModuleId]);
        updatedRequirements.push({
          requirementId: confirmation.requirementId,
          moduleId: targetModuleId,
        });
      }
    }

    return {
      createdModules,
      updatedRequirements,
    };
  }
}
