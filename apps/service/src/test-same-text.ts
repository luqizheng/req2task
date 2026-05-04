/* eslint-disable no-console */
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

import { ChromaVectorStore, initOllamaClient } from '@req2task/core';

async function testSameText() {
  console.log('=== Test Same Text Distance ===\n');

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

  // 用数据库中已有的内容查询
  const queryText = '远程控制编程容器';

  console.log(`Query: "${queryText}"`);
  console.log('');

  const results = await vectorStore.searchWithFilter(queryText, { projectId: '076943cb-f63c-4a17-9af1-b4e35ce6483f' }, 3);

  console.log('Results:');
  for (const r of results) {
    console.log(`  id: ${r.id}`);
    console.log(`  score: ${r.score.toFixed(6)}`);
    console.log(`  content: "${r.content}"`);
    console.log('');
  }
}

testSameText().catch(console.error);
