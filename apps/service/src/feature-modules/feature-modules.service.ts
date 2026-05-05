import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { FeatureModule } from '@req2task/core';
import {
  CreateFeatureModuleDto,
  UpdateFeatureModuleDto,
  FeatureModuleResponseDto,
  FeatureModuleListResponseDto,
  ModuleRecommendItemDto,
} from '@req2task/dto';
import { RequirementVectorService } from '../ai/requirement-vector.service';

@Injectable()
export class FeatureModulesService {
  private readonly MIN_SCORE_THRESHOLD = 0.3;
  private readonly RECOMMEND_LIMIT = 5;

  constructor(
    @InjectRepository(FeatureModule)
    private featureModuleRepository: Repository<FeatureModule>,
    private readonly vectorService: RequirementVectorService,
  ) {}

  private toResponseDto(module: FeatureModule): FeatureModuleResponseDto {
    return {
      id: module.id,
      name: module.name,
      description: module.description,
      moduleKey: module.moduleKey,
      aliases: module.aliases,
      keywords: module.keywords,
      path: module.path,
      sort: module.sort,
      parentId: module.parentId,
      projectId: module.projectId,
      children: (module.children || []).map((c) => this.toResponseDto(c)),
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
    };
  }

  private async calculatePath(module: FeatureModule): Promise<string> {
    const paths: string[] = [module.name];
    let current = module;
    while (current.parentId) {
      const parent = await this.featureModuleRepository.findOne({
        where: { id: current.parentId },
      });
      if (parent) {
        paths.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }
    return paths.join(' / ');
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
      aliases: createDto.aliases || null,
      keywords: createDto.keywords || null,
      sort: createDto.sort || 0,
      parentId: createDto.parentId || null,
      projectId: createDto.projectId,
    });

    module.path = await this.calculatePath(module);

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

    if (updateDto.name) {
      module.name = updateDto.name;
      module.path = await this.calculatePath(module);
    }
    if (updateDto.description !== undefined) module.description = updateDto.description;
    if (updateDto.aliases !== undefined) module.aliases = updateDto.aliases || null;
    if (updateDto.keywords !== undefined) module.keywords = updateDto.keywords || null;
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

  async recommendModules(
    projectId: string,
    content: string,
  ): Promise<ModuleRecommendItemDto[]> {
    const [vectorResults, keywordResults] = await Promise.all([
      this.searchByVector(content, projectId),
      this.searchByKeywords(content, projectId),
    ]);

    const merged = this.mergeResults(vectorResults, keywordResults, content);
    return merged;
  }

  private async searchByVector(
    content: string,
    projectId: string,
  ): Promise<ModuleRecommendItemDto[]> {
    try {
      const similarRequirements = await this.vectorService.searchSimilarRequirements(
        content,
        projectId,
        this.RECOMMEND_LIMIT,
      );

      const moduleScores = new Map<string, number>();

      for (const result of similarRequirements) {
        if (result.score < this.MIN_SCORE_THRESHOLD) continue;

        const reqContent = result.content;
        const modules = await this.featureModuleRepository.find({
          where: { projectId },
        });

        for (const module of modules) {
          const score = this.calculateContentMatchScore(module, reqContent);
          const existingScore = moduleScores.get(module.id) || 0;
          const combinedScore = (existingScore + result.score + score) / 3;
          moduleScores.set(module.id, Math.max(existingScore, combinedScore));
        }
      }

      return Array.from(moduleScores.entries())
        .filter(([, score]) => score >= this.MIN_SCORE_THRESHOLD)
        .sort(([, a], [, b]) => b - a)
        .slice(0, this.RECOMMEND_LIMIT)
        .map(([moduleId, score]) => {
          const module = this.featureModuleRepository.findOne({ where: { id: moduleId } });
          return {
            moduleId,
            moduleName: (module as unknown as FeatureModule)?.name || null,
            score,
            isNew: false,
            suggestedName: null,
            suggestedDescription: null,
          } as ModuleRecommendItemDto;
        });
    } catch (error) {
      console.warn('Vector search failed, falling back to keyword search:', error);
      return [];
    }
  }

  private async searchByKeywords(
    content: string,
    projectId: string,
  ): Promise<ModuleRecommendItemDto[]> {
    const keywords = this.extractKeywords(content);
    const modules = await this.featureModuleRepository.find({
      where: { projectId },
    });

    const results: ModuleRecommendItemDto[] = [];

    for (const module of modules) {
      const score = this.calculateKeywordScore(module, keywords);
      if (score >= this.MIN_SCORE_THRESHOLD) {
        results.push({
          moduleId: module.id,
          moduleName: module.name,
          score,
          isNew: false,
          suggestedName: null,
          suggestedDescription: null,
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, this.RECOMMEND_LIMIT);
  }

  private mergeResults(
    vectorResults: ModuleRecommendItemDto[],
    keywordResults: ModuleRecommendItemDto[],
    content: string,
  ): ModuleRecommendItemDto[] {
    const scoreMap = new Map<string, ModuleRecommendItemDto>();

    for (const result of vectorResults) {
      scoreMap.set(result.moduleId!, {
        ...result,
        score: result.score * 0.6,
      });
    }

    for (const result of keywordResults) {
      const existing = scoreMap.get(result.moduleId!);
      if (existing) {
        existing.score = Math.max(existing.score, result.score * 0.4 + existing.score * 0.6);
      } else {
        scoreMap.set(result.moduleId!, {
          ...result,
          score: result.score * 0.4,
        });
      }
    }

    const sorted = Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, this.RECOMMEND_LIMIT);

    if (sorted.length === 0 || sorted[0].score < 0.5) {
      sorted.push({
        moduleId: null,
        moduleName: null,
        score: 0,
        isNew: true,
        suggestedName: this.generateModuleName(content),
        suggestedDescription: this.generateModuleDescription(content),
      });
    }

    return sorted;
  }

  private extractKeywords(content: string): string[] {
    const stopWords = new Set([
      '的', '了', '和', '是', '在', '有', '个', '与', '对', '等',
      'the', 'a', 'an', 'is', 'are', 'and', 'or', 'to', 'in',
    ]);

    return content
      .split(/[\s,，。、()（）【】[""''『』]+/)
      .filter((w) => w.length >= 2 && !stopWords.has(w.toLowerCase()))
      .slice(0, 20);
  }

  private calculateKeywordScore(module: FeatureModule, keywords: string[]): number {
    const searchableText = [
      module.name,
      module.description,
      ...(module.aliases || []),
      ...(module.keywords || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchedKeywords = keywords.filter((k) =>
      searchableText.includes(k.toLowerCase()),
    );

    return keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;
  }

  private calculateContentMatchScore(module: FeatureModule, content: string): number {
    const moduleText = [
      module.name,
      module.description,
      ...(module.aliases || []),
      ...(module.keywords || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const contentLower = content.toLowerCase();
    const moduleWords = new Set(moduleText.split(/\s+/).filter((w) => w.length > 1));
    const contentWords = new Set(contentLower.split(/\s+/).filter((w) => w.length > 1));

    let matches = 0;
    for (const word of moduleWords) {
      if (contentWords.has(word) || contentLower.includes(word)) {
        matches++;
      }
    }

    return moduleWords.size > 0 ? matches / moduleWords.size : 0;
  }

  private generateModuleName(content: string): string {
    const words = this.extractKeywords(content);
    if (words.length === 0) return '新模块';
    return words.slice(0, 3).join('') + '管理';
  }

  private generateModuleDescription(content: string): string {
    return `基于需求"${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"创建的功能模块`;
  }

  async createFromRecommendation(
    createDto: {
      name: string;
      description?: string;
      projectId: string;
      parentId?: string;
      aliases?: string[];
      keywords?: string[];
    }
  ): Promise<FeatureModuleResponseDto> {
    const moduleKey = createDto.name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');

    const dto = new CreateFeatureModuleDto();
    dto.name = createDto.name;
    dto.description = createDto.description;
    dto.moduleKey = moduleKey || `module_${Date.now()}`;
    dto.projectId = createDto.projectId;
    dto.parentId = createDto.parentId;
    dto.aliases = createDto.aliases;
    dto.keywords = createDto.keywords;

    return this.create(dto);
  }
}
