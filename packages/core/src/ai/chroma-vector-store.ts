import { Injectable } from '@nestjs/common';
import { VectorStore, VectorDocument, SearchResult } from './vector-store.interface';

@Injectable()
export class ChromaVectorStore implements VectorStore {
  private documents: Map<string, VectorDocument> = new Map();

  async add(documents: VectorDocument[]): Promise<void> {
    for (const doc of documents) {
      this.documents.set(doc.id, doc);
    }
  }

  async search(query: string, limit: number = 5): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const [id, doc] of this.documents.entries()) {
      const score = this.calculateSimilarity(query, doc.content);

      if (score > 0.1) {
        results.push({
          id,
          content: doc.content,
          score,
          metadata: doc.metadata,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.documents.delete(id);
    }
  }

  async deleteByFilter(filter: Record<string, any>): Promise<void> {
    const toDelete: string[] = [];

    for (const [id, doc] of this.documents.entries()) {
      let match = true;
      for (const [key, value] of Object.entries(filter)) {
        if (doc.metadata?.[key] !== value) {
          match = false;
          break;
        }
      }
      if (match) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      this.documents.delete(id);
    }
  }

  private calculateSimilarity(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);

    let matchCount = 0;
    for (const queryWord of queryWords) {
      if (contentWords.some((w) => w.includes(queryWord))) {
        matchCount++;
      }
    }

    return matchCount / queryWords.length;
  }
}
