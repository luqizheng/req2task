import { Injectable } from "@nestjs/common";

import {
  PromptService,
  ChromaVectorStore,
  VectorDocument,
  SearchResult,
} from "@req2task/core";

@Injectable()
export class AiService {
  constructor(private vectorStore: ChromaVectorStore) {}

  async searchVectorStore(
    query: string,
    limit: number = 5,
  ): Promise<SearchResult[]> {
    return this.vectorStore.search(query, limit);
  }

  async addToVectorStore(documents: VectorDocument[]): Promise<void> {
    await this.vectorStore.add(documents);
  }
}
