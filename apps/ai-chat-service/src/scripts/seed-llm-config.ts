import 'reflect-metadata';
import { dataSource } from '../database/index.js';
import { LLMConfig } from '../database/entities/llm-config.entity.js';
import { LLMProviderType } from '../types.js';

async function seed() {
  await dataSource.initialize();
  console.log('Database connected');

  const existing = await dataSource.manager.findOne(LLMConfig, {
    where: { isDefault: true },
  });

  if (existing) {
    console.log('Default LLM config already exists:', existing.name);
    process.exit(0);
  }

  const config = dataSource.manager.create(LLMConfig, {
    name: 'OpenAI Default',
    provider: LLMProviderType.OPENAI,
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
    baseUrl: process.env.OPENAI_BASE_URL || null,
    modelName: process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    isActive: true,
    isDefault: true,
  });

  await dataSource.manager.save(config);
  console.log('Default LLM config created:', config.id);

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
