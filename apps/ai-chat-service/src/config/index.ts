import 'dotenv/config';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  serviceApiUrl: string;
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
  serviceApiUrl: getEnv('SERVICE_API_URL', 'http://localhost:4000'),
};
