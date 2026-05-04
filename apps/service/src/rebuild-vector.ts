/* eslint-disable no-console */
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

import { DataSource } from 'typeorm';
import {
  Requirement,
  RawRequirement,
  ChromaVectorStore,
  VectorDocument,
  Project,
  User,
  FeatureModule,
  Conversation,
  ConversationMessage,
  RequirementChangeLog,
  UserStory,
  AcceptanceCriteria,
  Task,
} from '@req2task/core';
import { initOllamaClient } from '@req2task/core';

interface RebuildVectorOptions {
  projectId?: string;
  clean?: boolean;
}

async function rebuildVector(options: RebuildVectorOptions = {}): Promise<void> {
  console.log('Starting vector store rebuild...');
  console.log(`Project filter: ${options.projectId || 'all'}`);
  console.log(`Clean rebuild: ${options.clean ? 'YES (delete collection first)' : 'NO'}`);

  initOllamaClient({
    host: process.env.OLLAMA_HOST || 'localhost',
    port: parseInt(process.env.OLLAMA_PORT || '11435'),
    model: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
  });

  const vectorStore = new ChromaVectorStore({
    host: process.env.CHROMA_HOST || 'localhost',
    port: parseInt(process.env.CHROMA_PORT || '8000'),
    authToken: process.env.CHROMA_AUTH_TOKEN,
  }, 'requirements');

  await vectorStore.connect();
  console.log('Connected to ChromaDB');

  if (options.clean) {
    console.log('Performing clean rebuild (deleting collection first)...');
    await vectorStore.recreateCollection();
  }

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'req2task',
    entities: [
      Requirement,
      RawRequirement,
      Project,
      User,
      FeatureModule,
      Conversation,
      ConversationMessage,
      RequirementChangeLog,
      UserStory,
      AcceptanceCriteria,
      Task,
    ],
  });

  await dataSource.initialize();
  console.log('Connected to database');

  try {
    const requirementRepo = dataSource.getRepository(Requirement);
    const rawRequirementRepo = dataSource.getRepository(RawRequirement);

    let requirementQuery = requirementRepo.createQueryBuilder('r');
    let rawRequirementQuery = rawRequirementRepo.createQueryBuilder('rr');

    if (options.projectId) {
      requirementQuery = requirementQuery.where('r.projectId = :projectId', { projectId: options.projectId });
      rawRequirementQuery = rawRequirementQuery.where('rr.projectId = :projectId', { projectId: options.projectId });
    }

    const requirements = await requirementQuery.getMany();
    const rawRequirements = await rawRequirementQuery.getMany();

    console.log(`Found ${requirements.length} requirements and ${rawRequirements.length} raw requirements`);

    if (options.projectId) {
      await vectorStore.deleteByFilter({ projectId: options.projectId });
    }

    const documents: VectorDocument[] = [];

    for (const req of requirements) {
      const parts: string[] = [req.title, req.description];
      if (req.keyElements && req.keyElements.length > 0) {
        parts.push(`关键要素: ${req.keyElements.join(", ")}`);
      }
      const content = parts.join('\n');
      documents.push({
        id: `requirement:${req.id}`,
        content,
        metadata: { projectId: req.projectId, moduleId: req.moduleId || undefined, type: 'requirement' } as Record<string, unknown>,
      });
    }

    for (const rr of rawRequirements) {
      const content = rr.clarifiedContent || rr.originalContent;
      documents.push({
        id: `raw_requirement:${rr.id}`,
        content,
        metadata: { projectId: rr.projectId, type: 'raw_requirement' } as Record<string, unknown>,
      });
    }

    if (documents.length > 0) {
      await vectorStore.add(documents);
    }

    console.log(`\nRebuild complete:`);
    console.log(`  - Requirements indexed: ${requirements.length}`);
    console.log(`  - Raw Requirements indexed: ${rawRequirements.length}`);
    console.log(`  - Total: ${documents.length}`);

  } finally {
    await vectorStore.close();
    await dataSource.destroy();
  }
}

const args = process.argv.slice(2);
let projectId: string | undefined;
let clean = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-p' || args[i] === '--project-id') {
    projectId = args[i + 1];
  } else if (args[i] === '--clean') {
    clean = true;
  }
}

rebuildVector({ projectId, clean }).catch((error) => {
  console.error('Rebuild failed:', error);
  process.exit(1);
});
