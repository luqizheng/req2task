import axios, { AxiosInstance } from 'axios';

let ollamaClient: AxiosInstance | null = null;
let embeddingModel = 'nomic-embed-text';

export interface OllamaConfig {
  host: string;
  port: number;
  model?: string;
}

export function initOllamaClient(config: OllamaConfig): void {
  const baseURL = `http://${config.host}:${config.port}`;
  ollamaClient = axios.create({
    baseURL,
    timeout: 30000,
  });
  embeddingModel = config.model || 'nomic-embed-text';
  console.warn(`Ollama client initialized: ${baseURL}, model: ${embeddingModel}`);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!ollamaClient) {
    throw new Error('Ollama client not initialized. Call initOllamaClient() first.');
  }

  const embeddings: number[][] = [];

  for (const text of texts) {
    try {
      const response = await ollamaClient.post('/api/embeddings', {
        model: embeddingModel,
        prompt: text,
      });

      if (response.data && Array.isArray(response.data.embedding)) {
        embeddings.push(response.data.embedding);
      } else {
        throw new Error(`Invalid embedding response for text: ${text.substring(0, 50)}...`);
      }
    } catch (error) {
      console.error(`Failed to generate embedding: ${error}`);
      throw error;
    }
  }

  return embeddings;
}

export async function checkOllamaHealth(): Promise<boolean> {
  if (!ollamaClient) {
    return false;
  }

  try {
    const response = await ollamaClient.get('/api/tags');
    return response.status === 200;
  } catch {
    return false;
  }
}

export function getEmbeddingModel(): string {
  return embeddingModel;
}
