import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

const User = require('@req2task/core/dist/entities/user.entity').User;

console.log('User class:', User);

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'req2task',
  entities: [User],
  synchronize: false,
  logging: true,
});

async function main() {
  await dataSource.initialize();
  console.log('Entities after init:', dataSource.entityMetadatas.length);
  console.log('Entity names:', dataSource.entityMetadatas.map(e => e.name));
  await dataSource.destroy();
}

main().catch(console.error);