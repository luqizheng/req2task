import * as dotenv from 'dotenv';
import { User } from '@req2task/core';
import { DataSource } from 'typeorm';
import { resolve, join } from 'path';
import * as fs from 'fs';

dotenv.config({ path: '.env' });

const serviceRoot = resolve('D:/projects/req2task/apps/service');

console.log('Service root:', serviceRoot);
console.log('Migrations dir exists:', fs.existsSync(join(serviceRoot, 'dist', 'src', 'migrations')));

const migrationFiles = fs.readdirSync(join(serviceRoot, 'dist', 'src', 'migrations'));
console.log('Migration files:', migrationFiles);

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'req2task',
  entities: [User],
  migrations: migrationFiles.map(f => join(serviceRoot, 'dist', 'src', 'migrations', f)),
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: true,
});

async function test() {
  await AppDataSource.initialize();
  console.log('Migrations found:', AppDataSource.migrations.map(m => m.name));
  console.log('Pending:', await AppDataSource.runMigrations());
  await AppDataSource.destroy();
}

test().catch(console.error);