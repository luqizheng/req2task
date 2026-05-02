/* eslint-disable no-console */
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

import { DataSource } from 'typeorm';
import { Requirement, RawRequirement, ChromaVectorStore, VectorDocument } from '@req2task/core';
import { initOllamaClient } from '@req2task/core';

interface RebuildVectorOptions {
  projectId?: string;
}

async function rebuildVector(options: RebuildVectorOptions = {}): Promise<void> {
  console.log('Starting vector store rebuild...');
  console.log(`Project filter: ${options.projectId || 'all'}`);

  initOllamaClient({
    host: process.env.OLLAMA_HOST || 'localhost',
    port: parseInt(process.env.OLLAMA_PORT || '11434'),
    model: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
  });

  const vectorStore = new ChromaVectorStore({
    host: process.env.CHROMA_HOST || 'localhost',
    port: parseInt(process.env.CHROMA_PORT || '8000'),
    authToken: process.env.CHROMA_AUTH_TOKEN,
  }, 'requirements');

  await vectorStore.connect();
  console.log('Connected to ChromaDB');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'req2task',
    entities: [Requirement, RawRequirement],
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
      const content = [req.title, req.content, req.keyElements?.join(', ')].filter(Boolean).join('\n');
      documents.push({
        id: `requirement:${req.id}`,
        content,
        metadata: { projectId: req.projectId, moduleId: req.moduleId || undefined, type: 'requirement' },
      });
    }

    for (const rr of rawRequirements) {
      const content = rr.clarifiedContent || rr.originalContent;
      documents.push({
        id: `raw_requirement:${rr.id}`,
        content,
        metadata: { projectId: rr.projectId, type: 'raw_requirement' },
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

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-p' || args[i] === '--project-id') {
    projectId = args[i + 1];
    break;
  }
}

rebuildVector({ projectId }).catch((error) => {
  console.error('Rebuild failed:', error);
  process.exit(1);
});
