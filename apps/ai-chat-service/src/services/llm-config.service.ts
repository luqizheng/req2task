import { Repository, DataSource } from 'typeorm';
import { LLMConfig } from '../database/entities/llm-config.entity.js';
import { LLMProviderType } from '../types.js';
import type { CreateLLMConfigRequest, UpdateLLMConfigRequest, LLMConfigMetadata } from '../types.js';

export class LLMConfigService {
  private repo: Repository<LLMConfig>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(LLMConfig);
  }

  async create(data: CreateLLMConfigRequest): Promise<LLMConfig> {
    if (data.isDefault) {
      await this.clearDefault();
    }

    const config = this.repo.create({
      name: data.name,
      provider: data.provider,
      apiKey: data.apiKey || '',
      baseUrl: data.baseUrl || null,
      modelName: data.modelName,
      maxTokens: data.maxTokens || 4096,
      temperature: data.temperature || 0.7,
      topP: data.topP || 1.0,
      isActive: data.isActive ?? true,
      isDefault: data.isDefault || false,
    });

    return this.repo.save(config);
  }

  async findAll(): Promise<LLMConfig[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<LLMConfig | null> {
    return this.repo.findOne({
      where: { id },
      select: ['id', 'name', 'provider', 'baseUrl', 'modelName', 'maxTokens', 'temperature', 'topP', 'isActive', 'isDefault', 'createdAt', 'updatedAt'],
    });
  }

  async findByIdWithKey(id: string): Promise<LLMConfig | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, data: UpdateLLMConfigRequest): Promise<LLMConfig | null> {
    const config = await this.repo.findOne({ where: { id } });
    if (!config) return null;

    if (data.isDefault) {
      await this.clearDefault();
    }

    if (data.name !== undefined) config.name = data.name;
    if (data.provider !== undefined) config.provider = data.provider;
    if (data.apiKey !== undefined) config.apiKey = data.apiKey;
    if (data.baseUrl !== undefined) config.baseUrl = data.baseUrl || null;
    if (data.modelName !== undefined) config.modelName = data.modelName;
    if (data.maxTokens !== undefined) config.maxTokens = data.maxTokens;
    if (data.temperature !== undefined) config.temperature = data.temperature;
    if (data.topP !== undefined) config.topP = data.topP;
    if (data.isActive !== undefined) config.isActive = data.isActive;
    if (data.isDefault !== undefined) config.isDefault = data.isDefault;

    return this.repo.save(config);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  async getDefault(): Promise<LLMConfig | null> {
    return this.repo.findOne({
      where: { isDefault: true, isActive: true },
    });
  }

  async getActive(): Promise<LLMConfig[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async getMetadata(id?: string): Promise<LLMConfigMetadata | null> {
    let config: LLMConfig | null;

    if (id) {
      config = await this.findByIdWithKey(id);
    } else {
      config = await this.getDefault();
    }

    if (!config) return null;

    return {
      provider: config.provider,
      modelName: config.modelName,
      baseUrl: config.baseUrl || undefined,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      topP: config.topP,
    };
  }

  private async clearDefault(): Promise<void> {
    await this.repo.update({ isDefault: true }, { isDefault: false });
  }
}
