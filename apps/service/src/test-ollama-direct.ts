/* eslint-disable no-console */
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

import { initOllamaClient, generateEmbeddings } from '@req2task/core';

async function testOllama() {
  console.log('=== Ollama Embedding Test ===\n');

  initOllamaClient({
    host: process.env.OLLAMA_HOST || 'localhost',
    port: parseInt(process.env.OLLAMA_PORT || '11435'),
    model: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
  });

  const texts = [
    '多语言容器支持 支持多种编程语言或框架，如OpenCode+Java、OpenCode+Node.js等',
    '错误处理与用户干预',
    '远程控制编程容器',
    '多语言容器支持',
  ];

  console.log('Testing embedding for different texts:\n');
  
  try {
    const embeddings = await generateEmbeddings(texts);
    
    for (let i = 0; i < texts.length; i++) {
      const emb = embeddings[i];
      const norm = Math.sqrt(emb.reduce((sum, v) => sum + v * v, 0));
      console.log(`[${i + 1}] "${texts[i].substring(0, 30)}..."`);
      console.log(`    Dimension: ${emb.length}`);
      console.log(`    Norm: ${norm.toFixed(4)}`);
      console.log(`    First 5 values: [${emb.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
      
      // Calculate cosine similarity with first text
      if (i > 0) {
        const first = embeddings[0];
        let dotProduct = 0;
        for (let j = 0; j < emb.length; j++) {
          dotProduct += first[j] * emb[j];
        }
        const cosSim = dotProduct / (Math.sqrt(first.reduce((s, v) => s + v * v, 0)) * norm);
        console.log(`    Cosine similarity with text[0]: ${cosSim.toFixed(4)}`);
      }
      console.log('');
    }
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

testOllama().catch(console.error);
