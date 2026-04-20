import 'reflect-metadata';
import { DataSource } from 'typeorm';
import 'dotenv/config';
import { Conversation } from './entities/conversation.entity.js';
import { ConversationMessage } from './entities/conversation-message.entity.js';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env['DATABASE_HOST'] || 'localhost',
  port: parseInt(process.env['DATABASE_PORT'] || '5432', 10),
  username: process.env['DATABASE_USER'] || 'postgres',
  password: process.env['DATABASE_PASSWORD'] || 'postgres',
  database: process.env['DATABASE_NAME'] || 'ai_chat',
  entities: [Conversation, ConversationMessage],
  migrations: ['./*.ts'],
  synchronize: false,
  logging: true,
});

export default dataSource;
