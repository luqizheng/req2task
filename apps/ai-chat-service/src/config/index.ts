import 'dotenv/config';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface LLMConfig {
  apiKey: string;
  defaultModel: string;
  baseUrl?: string;
  provider: 'openai' | 'ollama';
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  llm: LLMConfig;
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

function getEnvInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

export const config: Config = {
  app: {
    port: getEnvInt('PORT', 4001),
    nodeEnv: getEnv('NODE_ENV', 'development'),
  },
  database: {
    host: getEnv('DATABASE_HOST', 'localhost'),
    port: getEnvInt('DATABASE_PORT', 5432),
    username: getEnv('DATABASE_USER', 'postgres'),
    password: getEnv('DATABASE_PASSWORD', 'postgres'),
    database: getEnv('DATABASE_NAME', 'ai_chat'),
  },
  llm: {
    apiKey: getEnv('OPENAI_API_KEY', ''),
    defaultModel: getEnv('DEFAULT_MODEL', 'gpt-4o-mini'),
    baseUrl: process.env['OLLAMA_BASE_URL'] || undefined,
    provider: (getEnv('DEFAULT_PROVIDER', 'openai') as 'openai' | 'ollama'),
  },
};
