import crypto from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { LLMConfig } from '../database/index.js';
import type { LLMConfigResponseDto } from '@req2task/dto';
import { logger } from '../utils/logger.js';

const ALGORITHM = 'aes-256-cbc';

function getEncryptionKey(): Buffer {
  const key = process.env.LLM_CONFIG_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('LLM_CONFIG_ENCRYPTION_KEY environment variable is not set');
  }
  return crypto.createHash('sha256').update(key).digest();
}

function decryptKey(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    return encryptedText;
  }
  try {
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return encryptedText;
  }
}

export class ServiceApiService {
  private repo: Repository<LLMConfig>;

  constructor(dataSource?: DataSource) {
    this.repo = dataSource
      ? dataSource.getRepository(LLMConfig)
      : (() => {
          throw new Error('DataSource is required for ServiceApiService');
        })();
  }

  async getDefaultLLMConfig(): Promise<LLMConfigResponseDto | null> {
    try {
      const configs = await this.repo.find({
        where: { isActive: true },
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      });

      if (configs.length === 0) {
        logger.warn('No LLM configs found in database');
        return null;
      }

      const defaultConfig = configs.find((c) => c.isDefault);
      const activeConfig = defaultConfig || configs[0];

      return {
        id: activeConfig.id,
        name: activeConfig.name,
        provider: activeConfig.provider,
        modelName: activeConfig.modelName,
        baseUrl: activeConfig.baseUrl,
        maxTokens: activeConfig.maxTokens,
        temperature: activeConfig.temperature,
        topP: activeConfig.topP,
        isActive: activeConfig.isActive,
        isDefault: activeConfig.isDefault,
        apiKey: activeConfig.apiKey ? decryptKey(activeConfig.apiKey) : undefined,
        createdAt: activeConfig.createdAt,
        updatedAt: activeConfig.updatedAt,
      };
    } catch (error) {
      logger.error({ error }, 'Error fetching default LLM config from database');
      return null;
    }
  }

  async getLLMConfigById(id: string): Promise<LLMConfigResponseDto | null> {
    try {
      const config = await this.repo.findOneBy({ id });
      if (!config) {
        return null;
      }

      return {
        id: config.id,
        name: config.name,
        provider: config.provider,
        modelName: config.modelName,
        baseUrl: config.baseUrl,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        topP: config.topP,
        isActive: config.isActive,
        isDefault: config.isDefault,
        apiKey: config.apiKey ? decryptKey(config.apiKey) : undefined,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };
    } catch (error) {
      logger.error({ error }, 'Error fetching LLM config from database');
      return null;
    }
  }

  async syncFromRemote(): Promise<{ synced: number; errors: number }> {
    try {
      const remoteConfigs = await this.fetchRemoteConfigs();
      if (!remoteConfigs || remoteConfigs.length === 0) {
        logger.info('No remote configs to sync');
        return { synced: 0, errors: 0 };
      }

      let synced = 0;
      let errors = 0;

      for (const remoteConfig of remoteConfigs) {
        try {
          const existing = await this.repo.findOneBy({ id: remoteConfig.id });
          if (existing) {
            await this.repo.update(existing.id, {
              name: remoteConfig.name,
              provider: remoteConfig.provider,
              modelName: remoteConfig.modelName,
              baseUrl: remoteConfig.baseUrl,
              maxTokens: remoteConfig.maxTokens,
              temperature: remoteConfig.temperature,
              topP: remoteConfig.topP,
              isActive: remoteConfig.isActive,
              isDefault: remoteConfig.isDefault,
            });
          } else {
            await this.repo.save({
              id: remoteConfig.id,
              name: remoteConfig.name,
              provider: remoteConfig.provider,
              modelName: remoteConfig.modelName,
              baseUrl: remoteConfig.baseUrl,
              apiKey: remoteConfig.apiKey || '',
              maxTokens: remoteConfig.maxTokens,
              temperature: remoteConfig.temperature,
              topP: remoteConfig.topP,
              isActive: remoteConfig.isActive,
              isDefault: remoteConfig.isDefault,
            });
          }
          synced++;
        } catch (err) {
          logger.error({ error: err, config: remoteConfig }, 'Failed to sync config');
          errors++;
        }
      }

      logger.info({ synced, errors }, 'Sync from remote completed');
      return { synced, errors };
    } catch (error) {
      logger.error({ error }, 'Failed to sync configs from remote');
      return { synced: 0, errors: 1 };
    }
  }

  private async fetchRemoteConfigs(): Promise<LLMConfigResponseDto[] | null> {
    try {
      const config = await import('../config/index.js');
      const response = await fetch(`${config.config.serviceApiUrl}/api/ai/llm-configs`);
      if (!response.ok) {
        return null;
      }
      const result = await response.json() as { code: number; data?: { configs: LLMConfigResponseDto[] } | LLMConfigResponseDto[] };
      if (result.code !== 0) {
        return null;
      }
      if (Array.isArray(result.data)) {
        return result.data;
      }
      return result.data?.configs || null;
    } catch {
      return null;
    }
  }
}
