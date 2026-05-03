import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Requirement, FeatureModule } from "@req2task/core";
import {
  EntityKeyService,
  EntityKeyType,
} from "../common/services/entity-key.service";
import { RequirementStatus, Priority, RequirementSource } from "@req2task/dto";
import {
  RequirementDto,
  RequirementResponseDto,
  RequirementListResponseDto,
  ModuleSummaryDto,
  UpdateRequirementDto,
} from "@req2task/dto";
import { UserStoriesService } from "./user-stories.service";
import { AcceptanceCriteriaService } from "./acceptance-criteria.service";

@Injectable()
export class RequirementsService {
  constructor(
    @InjectRepository(Requirement)
    private requirementRepository: Repository<Requirement>,
    @InjectRepository(FeatureModule)
    private featureModuleRepository: Repository<FeatureModule>,
    private userStoriesService: UserStoriesService,
    private acceptanceCriteriaService: AcceptanceCriteriaService,
    private entityKeyService: EntityKeyService,
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
    const push = [];
    for (const item of create) {
      const i = entityKeyIds.shift() || "";
      const t = await this.create(item, createdById, i, projectId);
      push.push(t);
    }
    for (const item of update) {
      const q = await this.update(item.id, item);
      push.push(q);
    }

    return push;
  }
  async save(
    dto: RequirementDto,
    createdById: string,
  ): Promise<RequirementResponseDto> {
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
    if (createDto.sourceRawRequirementId) {
      const existing = await this.requirementRepository.findOne({
        where: { sourceRawRequirementId: createDto.sourceRawRequirementId },
      });
      if (existing) {
        return this.findById(existing.id);
      }
    }

    let projectId: string | null = batchProjectId || null;
    const moduleIds = createDto.moduleIds || [];

    if (moduleIds.length > 0) {
      const modules = await this.featureModuleRepository.findBy({
        id: In(moduleIds),
      });
      projectId = modules[0]?.projectId || batchProjectId || null;
    }

    const MAX_RETRIES = 3;
    let saved: Requirement;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const entityKey =
        (entityKeySetting ?? projectId)
          ? await this.entityKeyService.generateEntityKey(
              projectId,
              EntityKeyType.REQ,
            )
          : [""];
      const requirement = this.requirementRepository.create({
        title: createDto.title,
        description: createDto.description || null,
        priority: createDto.priority || Priority.MEDIUM,
        source: createDto.source || RequirementSource.MANUAL,
        status: RequirementStatus.DRAFT,
        parentId: createDto.parentRequirementId || null,
        sourceRawRequirementId: createDto.sourceRawRequirementId || null,
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
          errMsg.includes("duplicate key") &&
          (errMsg.includes("entity_key") ||
            errMsg.includes("UQ_11df3ea432c3da480886b5033b3"));

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
      .createQueryBuilder("req")
      .innerJoin("req.modules", "module", "module.id = :moduleId", { moduleId })
      .leftJoinAndSelect("req.createdBy", "createdBy")
      .leftJoinAndSelect("req.userStories", "userStories")
      .leftJoinAndSelect("req.children", "children")
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy("req.createdAt", "DESC");

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
      .createQueryBuilder("req")
      .innerJoin("req.modules", "module", "module.projectId = :projectId", {
        projectId,
      })
      .leftJoinAndSelect("req.createdBy", "createdBy")
      .leftJoinAndSelect("req.userStories", "userStories")
      .leftJoinAndSelect("req.children", "children")
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy("req.createdAt", "DESC");

    const [items, total] = await query.getManyAndCount();

    return {
      items: items.map((r) => this.toListItemDto(r)),
      total,
      page,
      limit,
    };
  }

  async findByRawRequirement(
    rawRequirementId: string,
  ): Promise<RequirementResponseDto[]> {
    const requirements = await this.requirementRepository.find({
      where: { sourceRawRequirementId: rawRequirementId },
      relations: ["createdBy", "modules"],
      order: { createdAt: "DESC" },
    });
    return requirements.map((r) => this.toResponseDto(r));
  }

  async findById(id: string): Promise<RequirementResponseDto> {
    const requirement = await this.requirementRepository.findOne({
      where: { id },
      relations: [
        "createdBy",
        "userStories",
        "userStories.acceptanceCriteria",
        "children",
        "parent",
        "modules",
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
      relations: [
        "createdBy",
        "userStories",
        "userStories.acceptanceCriteria",
        "children",
        "modules",
      ],
    });

    if (!requirement) {
      throw new NotFoundException(`Requirement with ID ${id} not found`);
    }

    if (updateDto.title !== undefined) requirement.title = updateDto.title;
    if (updateDto.description !== undefined)
      requirement.description = updateDto.description;
    if (updateDto.priority !== undefined)
      requirement.priority = updateDto.priority;
    if (updateDto.status !== undefined) requirement.status = updateDto.status;
    if (updateDto.storyPoints !== undefined)
      requirement.storyPoints = updateDto.storyPoints;

    const updated = await this.requirementRepository.save(requirement);
    return this.findById(updated.id);
  }

  async updateModules(
    id: string,
    moduleIds: string[],
  ): Promise<RequirementResponseDto> {
    const requirement = await this.requirementRepository.findOne({
      where: { id },
      relations: ["modules"],
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
    const requirement = await this.requirementRepository.findOne({
      where: { id },
    });
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
      modules: requirement.modules
        ? requirement.modules.map((m) => this.toModuleSummaryDto(m))
        : [],
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
      modules: requirement.modules
        ? requirement.modules.map((m) => this.toModuleSummaryDto(m))
        : [],
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
