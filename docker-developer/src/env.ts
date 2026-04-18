import { writeFileSync, readFileSync, existsSync } from 'fs';
import { mkdirSync } from 'fs';
import pino from 'pino';
import { Config, EnvConfig } from './types.js';

const logger = pino({ name: 'env-manager' });

export class EnvManager {
  private config: Config;
  private currentConfig: EnvConfig | null = null;
  private envFilePath: string;
  private servicesFilePath: string;

  constructor(config: Config) {
    this.config = config;
    this.envFilePath = `${config.developer.workspace}/.env`;
    this.servicesFilePath = `${config.developer.workspace}/config/services.json`;

    this.ensureConfigDir();
  }

  private ensureConfigDir(): void {
    const configDir = `${this.config.developer.workspace}/config`;
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
  }

  async saveConfig(config: EnvConfig): Promise<void> {
    this.currentConfig = config;

    const envContent = this.generateEnvFile(config);
    writeFileSync(this.envFilePath, envContent);

    const servicesContent = JSON.stringify(config.services || {}, null, 2);
    writeFileSync(this.servicesFilePath, servicesContent);

    logger.info('Environment config saved');
  }

  private generateEnvFile(config: EnvConfig): string {
    const lines: string[] = [];

    if (config.database) {
      const db = config.database;
      lines.push(`DB_TYPE=${db.type}`);
      lines.push(`DB_HOST=${db.host}`);
      lines.push(`DB_PORT=${db.port}`);
      lines.push(`DB_USERNAME=${db.username}`);
      lines.push(`DB_PASSWORD=${db.password}`);
      lines.push(`DB_DATABASE=${db.database}`);
    }

    if (config.redis) {
      const redis = config.redis;
      lines.push(`REDIS_HOST=${redis.host}`);
      lines.push(`REDIS_PORT=${redis.port}`);
      if (redis.password) {
        lines.push(`REDIS_PASSWORD=${redis.password}`);
      }
      if (redis.db !== undefined) {
        lines.push(`REDIS_DB=${redis.db}`);
      }
    }

    if (config.envVars) {
      for (const [key, value] of Object.entries(config.envVars)) {
        lines.push(`${key}=${value}`);
      }
    }

    return lines.join('\n') + '\n';
  }

  getConfig(): EnvConfig | null {
    return this.currentConfig;
  }

  async generateEnvFileContent(): Promise<string> {
    if (!this.currentConfig) {
      return '';
    }
    return this.generateEnvFile(this.currentConfig);
  }

  updateEnvVars(vars: Record<string, string>): void {
    if (!this.currentConfig) {
      this.currentConfig = {};
    }

    if (!this.currentConfig.envVars) {
      this.currentConfig.envVars = {};
    }

    this.currentConfig.envVars = { ...this.currentConfig.envVars, ...vars };

    const envContent = this.generateEnvFile(this.currentConfig);
    writeFileSync(this.envFilePath, envContent);

    logger.info({ vars }, 'Environment variables updated');
  }

  get(key: string): string | undefined {
    if (this.currentConfig?.envVars) {
      return this.currentConfig.envVars[key];
    }
    return undefined;
  }
}
