import crypto from 'crypto';
import { Repository, DataSource } from 'typeorm';
import { LLMConfig } from '../database/index.js';
import { LLMProviderFactory } from '../llm/factory.js';
import type {
  CreateLlmConfigDto,
  UpdateLlmConfigDto,
  LlmConfigResponseDto,
  LlmConfigDetailResponseDto,
  LlmConfigListResponseDto,
  CreateLlmConfigResponseDto,
  UpdateLlmConfigResponseDto,
} from '@req2task/dto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.LLM_CONFIG_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('LLM_CONFIG_ENCRYPTION_KEY environment variable is not set');
  }
  return crypto.createHash('sha256').update(key).digest();
}

function encryptKey(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptKey(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export class LlMConfigService {
  private repo: Repository<LLMConfig>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(LLMConfig);
  }

  async create(dto: CreateLlmConfigDto): Promise<CreateLlmConfigResponseDto> {
    if (dto.isDefault) {
      await this.clearDefaultFlag();
    }

    const config = this.repo.create({
      name: dto.name,
      provider: dto.provider,
      modelName: dto.modelName || 'default',
      baseUrl: dto.baseUrl || null,
      apiKey: dto.apiKey ? encryptKey(dto.apiKey) : '',
      maxTokens: dto.maxTokens || 4096,
      temperature: dto.temperature ?? 0.7,
      topP: dto.topP ?? 1.0,
      isActive: true,
      isDefault: dto.isDefault || false,
    });

    const saved = await this.repo.save(config);
    return this.toDetailResponse(saved);
  }

  async findAll(): Promise<LlmConfigListResponseDto> {
    const [configs, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
    });

    return {
      configs: configs.map((c) => this.toResponse(c)),
      total,
    };
  }

  async findOne(id: string): Promise<LlmConfigDetailResponseDto | null> {
    const config = await this.repo.findOneBy({ id });
    if (!config) {
      return null;
    }
    return this.toDetailResponse(config);
  }

  async update(id: string, dto: UpdateLlmConfigDto): Promise<UpdateLlmConfigResponseDto | null> {
    const config = await this.repo.findOneBy({ id });
    if (!config) {
      return null;
    }

    if (dto.isDefault) {
      await this.clearDefaultFlag();
    }

    if (dto.name !== undefined) config.name = dto.name;
    if (dto.provider !== undefined) config.provider = dto.provider;
    if (dto.modelName !== undefined) config.modelName = dto.modelName;
    if (dto.baseUrl !== undefined) config.baseUrl = dto.baseUrl;
    if (dto.apiKey !== undefined) config.apiKey = dto.apiKey ? encryptKey(dto.apiKey) : '';
    if (dto.maxTokens !== undefined) config.maxTokens = dto.maxTokens;
    if (dto.temperature !== undefined) config.temperature = dto.temperature;
    if (dto.topP !== undefined) config.topP = dto.topP;
    if (dto.isActive !== undefined) config.isActive = dto.isActive;
    if (dto.isDefault !== undefined) config.isDefault = dto.isDefault;

    const updated = await this.repo.save(config);
    return this.toDetailResponse(updated);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const config = await this.repo.findOneBy({ id });
    if (!config) {
      return { success: false, message: 'Configuration not found' };
    }

    try {
      if (!config.apiKey && config.provider !== 'ollama') {
        return { success: false, message: 'API Key is not configured' };
      }

      const configForProvider = {
        ...config,
        apiKey: config.apiKey ? decryptKey(config.apiKey) : config.apiKey,
      };

      const provider = LLMProviderFactory.create(configForProvider as LLMConfig);
      const available = await provider.isAvailable();

      if (available) {
        return { success: true, message: `${provider.displayName} connection successful` };
      }
      return { success: false, message: `${provider.displayName} connection failed` };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  private async clearDefaultFlag(): Promise<void> {
    await this.repo.update({ isDefault: true }, { isDefault: false });
  }

  private toResponse(config: LLMConfig): LlmConfigResponseDto {
    return {
      id: config.id,
      name: config.name,
      provider: config.provider,
      modelName: config.modelName,
      baseUrl: config.baseUrl,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      topP: config.topP,
      isDefault: config.isDefault,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  private toDetailResponse(config: LLMConfig): LlmConfigDetailResponseDto {
    return {
      ...this.toResponse(config),
      apiKey: config.apiKey ? '[ENCRYPTED]' : null,
    };
  }
}
