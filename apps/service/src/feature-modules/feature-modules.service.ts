import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { FeatureModule } from '@req2task/core';
import {
  CreateFeatureModuleDto,
  UpdateFeatureModuleDto,
  FeatureModuleResponseDto,
  FeatureModuleListResponseDto,
} from '@req2task/dto';

@Injectable()
export class FeatureModulesService {
  constructor(
    @InjectRepository(FeatureModule)
    private featureModuleRepository: Repository<FeatureModule>,
  ) {}

  private toResponseDto(module: FeatureModule): FeatureModuleResponseDto {
    return {
      id: module.id,
      name: module.name,
      description: module.description,
      moduleKey: module.moduleKey,
      sort: module.sort,
      parentId: module.parentId,
      projectId: module.projectId,
      children: (module.children || []).map((c) => this.toResponseDto(c)),
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
    };
  }

  async findByProject(
    projectId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<FeatureModuleListResponseDto> {
    const [items, total] = await this.featureModuleRepository.findAndCount({
      where: { projectId },
      skip: (page - 1) * limit,
      take: limit,
      order: { sort: 'ASC', createdAt: 'DESC' },
    });

    return {
      items: items.map((m) => this.toResponseDto(m)),
      total,
      page,
      limit,
    };
  }

  async findTreeByProject(projectId: string): Promise<FeatureModuleResponseDto[]> {
    const roots = await this.featureModuleRepository.find({
      where: { projectId, parentId: IsNull() },
      relations: ['children', 'children.children'],
      order: { sort: 'ASC' },
    });
    return roots.map((r) => this.toResponseDto(r));
  }

  async findById(id: string): Promise<FeatureModuleResponseDto> {
    const module = await this.featureModuleRepository.findOne({
      where: { id },
      relations: ['children'],
    });
    if (!module) {
      throw new NotFoundException(`FeatureModule with ID ${id} not found`);
    }
    return this.toResponseDto(module);
  }

  async create(createDto: CreateFeatureModuleDto): Promise<FeatureModuleResponseDto> {
    if (createDto.parentId) {
      const parent = await this.featureModuleRepository.findOne({
        where: { id: createDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent module with ID ${createDto.parentId} not found`);
      }
      if (parent.projectId !== createDto.projectId) {
        throw new ConflictException('Parent module belongs to different project');
      }
    }

    const existing = await this.featureModuleRepository.findOne({
      where: { moduleKey: createDto.moduleKey, projectId: createDto.projectId },
    });
    if (existing) {
      throw new ConflictException('Module key already exists in this project');
    }

    const module = this.featureModuleRepository.create({
      name: createDto.name,
      description: createDto.description || null,
      moduleKey: createDto.moduleKey,
      sort: createDto.sort || 0,
      parentId: createDto.parentId || null,
      projectId: createDto.projectId,
    });

    const saved = await this.featureModuleRepository.save(module);
    return this.toResponseDto(saved);
  }

  async update(id: string, updateDto: UpdateFeatureModuleDto): Promise<FeatureModuleResponseDto> {
    const module = await this.featureModuleRepository.findOne({
      where: { id },
      relations: ['children'],
    });
    if (!module) {
      throw new NotFoundException(`FeatureModule with ID ${id} not found`);
    }

    if (updateDto.parentId !== undefined) {
      if (updateDto.parentId === id) {
        throw new ConflictException('Module cannot be its own parent');
      }
      if (updateDto.parentId) {
        const parent = await this.featureModuleRepository.findOne({
          where: { id: updateDto.parentId },
        });
        if (!parent) {
          throw new NotFoundException(`Parent module with ID ${updateDto.parentId} not found`);
        }
        if (parent.projectId !== module.projectId) {
          throw new ConflictException('Parent module belongs to different project');
        }
      }
      module.parentId = updateDto.parentId || null;
    }

    if (updateDto.name) module.name = updateDto.name;
    if (updateDto.description !== undefined) module.description = updateDto.description;
    if (updateDto.sort !== undefined) module.sort = updateDto.sort;

    const updated = await this.featureModuleRepository.save(module);
    return this.toResponseDto(updated);
  }

  async delete(id: string): Promise<void> {
    const module = await this.featureModuleRepository.findOne({
      where: { id },
      relations: ['children'],
    });
    if (!module) {
      throw new NotFoundException(`FeatureModule with ID ${id} not found`);
    }

    if (module.children && module.children.length > 0) {
      throw new ConflictException('Cannot delete module with children');
    }

    await this.featureModuleRepository.remove(module);
  }
}
