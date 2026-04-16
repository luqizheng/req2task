import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { resolve, join } from 'path';
import * as fs from 'fs';

dotenv.config({ path: '.env' });

const serviceRoot = 'D:/projects/req2task/apps/service';
const migrationsDir = join(serviceRoot, 'dist', 'src', 'migrations');

let migrationFiles: string[] = [];
if (fs.existsSync(migrationsDir)) {
  migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.js'))
    .map(f => join(migrationsDir, f));
}

const coreDist = 'D:/projects/req2task/packages/core/dist';
const User = require(join(coreDist, 'entities', 'user.entity.js')).User;

const options: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'req2task',
  entities: [User],
  migrations: migrationFiles,
  migrationsTableName: 'migrations',
  synchronize: false,
};

export const AppDataSource = new DataSource(options);