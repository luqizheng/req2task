import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config/index.js';
import { Conversation, ConversationStatus } from './entities/conversation.entity.js';
import { ConversationMessage } from './entities/conversation-message.entity.js';

export const dataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  entities: [Conversation, ConversationMessage],
  synchronize: config.app.nodeEnv === 'development',
  logging: config.app.nodeEnv === 'development',
});

export async function initializeDatabase(): Promise<DataSource> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  return dataSource;
}

export { Conversation, ConversationStatus };
export { ConversationMessage };
