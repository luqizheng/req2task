import { ConfigService } from '@nestjs/config';
import { ChromaVectorStore, ChromaConfig, initOllamaClient, OllamaConfig } from '@req2task/core';

export function createChromaVectorStore(configService: ConfigService): ChromaVectorStore {
  const chromaConfig: ChromaConfig = {
    host: configService.get<string>('CHROMA_HOST', 'localhost'),
    port: configService.get<number>('CHROMA_PORT', 8000),
    authToken: configService.get<string>('CHROMA_AUTH_TOKEN'),
  };

  const ollamaConfig: OllamaConfig = {
    host: configService.get<string>('OLLAMA_HOST', 'localhost'),
    port: configService.get<number>('OLLAMA_PORT', 11434),
    model: configService.get<string>('OLLAMA_EMBEDDING_MODEL', 'nomic-embed-text'),
  };

  console.warn('VectorStore Config:', {
    chroma: `${chromaConfig.host}:${chromaConfig.port}`,
    ollama: `${ollamaConfig.host}:${ollamaConfig.port}/${ollamaConfig.model}`,
  });

  initOllamaClient(ollamaConfig);

  const collectionName = configService.get<string>('CHROMA_COLLECTION', 'requirements');
  const vectorStore = new ChromaVectorStore(chromaConfig, collectionName);

  return vectorStore;
}

export async function initializeVectorStore(vectorStore: ChromaVectorStore): Promise<void> {
  await vectorStore.connect();
}
