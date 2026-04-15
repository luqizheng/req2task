import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '@req2task/core';
import { resolve, join } from 'path';

dotenv.config({ path: '.env' });

const cwd = process.cwd();
const projectRoot = resolve(cwd);
const serviceRoot = resolve(projectRoot, 'apps', 'service');

const options: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'req2task',
  entities: [User],
  migrations: [join(serviceRoot, 'src', 'migrations')],
  migrationsTableName: 'migrations',
};

export const AppDataSource = new DataSource(options);
