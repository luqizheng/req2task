import { ChromaClient, Collection, IEmbeddingFunction } from 'chromadb';
import { VectorStore, VectorDocument, SearchResult } from './vector-store.interface';

const DEFAULT_COLLECTION_NAME = 'requirements';
const DEFAULT_SEARCH_LIMIT = 5;

export interface ChromaConfig {
  host: string;
  port: number;
  authToken?: string;
}

export class ChromaVectorStore implements VectorStore {
  private client: ChromaClient | null = null;
  private collection: Collection | null = null;
  private embeddingFunction: IEmbeddingFunction;
  private config: ChromaConfig;
  private collectionName: string;

  constructor(config: ChromaConfig, collectionName: string = DEFAULT_COLLECTION_NAME) {
    this.config = config;
    this.collectionName = collectionName;
    this.embeddingFunction = this.createEmbeddingFunction();
  }

  private createEmbeddingFunction(): IEmbeddingFunction {
    return {
      name: 'ollama-embedding',
      generate: async (texts: string[]): Promise<number[][]> => {
        const { generateEmbeddings } = await import('./ollama-embedding');
        return generateEmbeddings(texts);
      },
    } as IEmbeddingFunction;
  }

  async connect(): Promise<void> {
    const url = `http://${this.config.host}:${this.config.port}`;
    const authHeader = this.config.authToken
      ? { Authorization: `Bearer ${this.config.authToken}` }
      : undefined;

    this.client = new ChromaClient({
      path: url,
      fetchOptions: authHeader ? { headers: authHeader } : undefined,
    });

    try {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: { description: `Vector store for ${this.collectionName}` },
        embeddingFunction: this.embeddingFunction,
      });
      console.warn(`Connected to ChromaDB collection: ${this.collectionName}`);
    } catch (error) {
      console.error(`Failed to connect to ChromaDB: ${error}`);
      throw error;
    }
  }

  async add(documents: VectorDocument[]): Promise<void> {
    if (!this.collection) {
      throw new Error('ChromaVectorStore not connected. Call connect() first.');
    }

    const ids = documents.map((d) => d.id);
    const texts = documents.map((d) => d.content);
    const metadatas = documents.map((d) => d.metadata || {}) as Record<string, string | number | boolean>[];

    await this.collection.add({
      ids,
      documents: texts,
      metadatas,
    });

    console.warn(`Added ${documents.length} documents to ChromaDB`);
  }

  async search(query: string, limit: number = DEFAULT_SEARCH_LIMIT): Promise<SearchResult[]> {
    if (!this.collection) {
      throw new Error('ChromaVectorStore not connected. Call connect() first.');
    }

    const results = await this.collection.query({
      queryTexts: [query],
      nResults: limit,
    });

    const searchResults: SearchResult[] = [];
    const distances = results.distances?.[0] || [];
    const documents = results.documents?.[0] || [];
    const metadatas = results.metadatas?.[0] || [];
    const ids = results.ids?.[0] || [];

    for (let i = 0; i < ids.length; i++) {
      const distance = distances[i] ?? 1;
      const score = 1 - Math.min(distance, 1);

      searchResults.push({
        id: ids[i],
        content: documents[i] || '',
        score,
        metadata: metadatas[i] as Record<string, unknown>,
      });
    }

    return searchResults;
  }

  async searchWithFilter(
    query: string,
    filter: Record<string, unknown>,
    limit: number = DEFAULT_SEARCH_LIMIT,
  ): Promise<SearchResult[]> {
    if (!this.collection) {
      throw new Error('ChromaVectorStore not connected. Call connect() first.');
    }

    const results = await this.collection.query({
      queryTexts: [query],
      nResults: limit,
      where: filter,
    });

    const searchResults: SearchResult[] = [];
    const distances = results.distances?.[0] || [];
    const documents = results.documents?.[0] || [];
    const metadatas = results.metadatas?.[0] || [];
    const ids = results.ids?.[0] || [];

    for (let i = 0; i < ids.length; i++) {
      const distance = distances[i] ?? 1;
      const score = 1 - Math.min(distance, 1);

      searchResults.push({
        id: ids[i],
        content: documents[i] || '',
        score,
        metadata: metadatas[i] as Record<string, unknown>,
      });
    }

    return searchResults;
  }

  async delete(ids: string[]): Promise<void> {
    if (!this.collection) {
      throw new Error('ChromaVectorStore not connected. Call connect() first.');
    }

    await this.collection.delete({
      ids,
    });

    console.warn(`Deleted ${ids.length} documents from ChromaDB`);
  }

  async deleteByFilter(filter: Record<string, unknown>): Promise<void> {
    if (!this.collection) {
      throw new Error('ChromaVectorStore not connected. Call connect() first.');
    }

    await this.collection.delete({
      where: filter,
    });

    console.warn(`Deleted documents matching filter from ChromaDB`);
  }

  async getCount(): Promise<number> {
    if (!this.collection) {
      throw new Error('ChromaVectorStore not connected. Call connect() first.');
    }

    return await this.collection.count();
  }

  async close(): Promise<void> {
    this.collection = null;
    this.client = null;
    console.warn('ChromaDB connection closed');
  }

  isConnected(): boolean {
    return this.client !== null && this.collection !== null;
  }
}
