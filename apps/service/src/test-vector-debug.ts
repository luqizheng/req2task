/* eslint-disable no-console */
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

import { ChromaVectorStore, initOllamaClient } from '@req2task/core';

async function testVectorFlow() {
  console.log('=== Vector Flow Debug Test ===\n');

  const chromaHost = process.env.CHROMA_HOST || 'localhost';
  const chromaPort = process.env.CHROMA_PORT || '8000';
  const chromaAuth = process.env.CHROMA_AUTH_TOKEN;
  const ollamaHost = process.env.OLLAMA_HOST || 'localhost';
  const ollamaPort = process.env.OLLAMA_PORT || '11435';
  const ollamaModel = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';

  console.log('Configuration:');
  console.log(`  ChromaDB: ${chromaHost}:${chromaPort}`);
  console.log(`  Ollama: ${ollamaHost}:${ollamaPort}/${ollamaModel}`);
  console.log('');

  // 1. Test Ollama connection
  console.log('1. Testing Ollama connection...');
  initOllamaClient({
    host: ollamaHost,
    port: parseInt(ollamaPort),
    model: ollamaModel,
  });

  const { generateEmbeddings } = await import('@req2task/core');
  const testText = '多语言容器支持';
  try {
    const embeddings = await generateEmbeddings([testText]);
    console.log(`   ✓ Ollama connected, embedding dimension: ${embeddings[0].length}`);
    console.log(`   ✓ Sample values: ${embeddings[0].slice(0, 5).map(v => v.toFixed(4)).join(', ')}...`);
  } catch (error) {
    console.error(`   ✗ Ollama error: ${error}`);
    return;
  }

  // 2. Test ChromaDB connection
  console.log('\n2. Testing ChromaDB connection...');
  
  const vectorStore = new ChromaVectorStore({
    host: chromaHost,
    port: parseInt(chromaPort),
    authToken: chromaAuth,
  }, 'requirements');

  await vectorStore.connect();
  console.log(`   ✓ ChromaDB connected`);

  // 3. Check requirements collection
  console.log('\n3. Checking requirements collection...');
  try {
    const count = await vectorStore.getCount();
    console.log(`   ✓ Document count: ${count}`);

    // Peek actual stored documents
    if (count > 0) {
      console.log('\n   Stored documents (first 5):');
      const docs = await vectorStore.peekDocuments(5);
      for (let i = 0; i < docs.length; i++) {
        console.log(`     [${i + 1}] ${docs[i].id}: "${docs[i].content.substring(0, 60)}..."`);
      }
    }
  } catch (error) {
    console.error(`   ✗ Collection error: ${error}`);
  }

  // 4. Test search
  console.log('\n4. Testing vector search...');
  try {
    const queryText = '多语言容器支持 支持多种编程语言或框架，如OpenCode+Java、OpenCode+Node.js等，以适应不同开发需求。';

    const results = await vectorStore.searchWithFilter(
      queryText,
      { projectId: '076943cb-f63c-4a17-9af1-b4e35ce6483f' },
      5
    );

    console.log(`   ✓ Search query: "${queryText.substring(0, 50)}..."`);
    console.log(`   ✓ Results count: ${results.length}`);

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      console.log(`     [${i + 1}] id=${r.id}, score=${r.score.toFixed(4)}, content="${r.content.substring(0, 40)}..."`);
    }

    // Check if any result has high similarity (score > 0.8)
    const hasHighSimilarity = results.some(r => r.score > 0.8);
    if (hasHighSimilarity) {
      console.log(`   ✓ Found high similarity result (> 0.8)!`);
    } else {
      console.log(`   ✗ No high similarity result found (all scores < 0.8)`);
    }
  } catch (error) {
    console.error(`   ✗ Search error: ${error}`);
  }

  console.log('\n=== Test Complete ===');
}

testVectorFlow().catch(console.error);
