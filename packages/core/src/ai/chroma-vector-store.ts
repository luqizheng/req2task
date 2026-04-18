import { VectorStore, VectorDocument, SearchResult } from './vector-store.interface';

const DEFAULT_SEARCH_LIMIT = 5;
const MIN_SIMILARITY_THRESHOLD = 0.1;

export class ChromaVectorStore implements VectorStore {
  private readonly documents: Map<string, VectorDocument> = new Map();

  async add(documents: VectorDocument[]): Promise<void> {
    const addedCount = documents.length;
    for (const doc of documents) {
      this.documents.set(doc.id, doc);
    }
    console.log(`Added ${addedCount} documents to vector store`);
  }

  async search(query: string, limit: number = DEFAULT_SEARCH_LIMIT): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const [id, doc] of this.documents.entries()) {
      const score = this.calculateSimilarity(query, doc.content);

      if (score > MIN_SIMILARITY_THRESHOLD) {
        results.push({
          id,
          content: doc.content,
          score,
          metadata: doc.metadata,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    const limitedResults = results.slice(0, limit);
    
    console.debug(`Search for "${query.substring(0, 50)}..." returned ${limitedResults.length} results`);
    return limitedResults;
  }

  async delete(ids: string[]): Promise<void> {
    let deletedCount = 0;
    for (const id of ids) {
      if (this.documents.delete(id)) {
        deletedCount++;
      }
    }
    console.log(`Deleted ${deletedCount} documents from vector store`);
  }

  async deleteByFilter(filter: Record<string, unknown>): Promise<void> {
    const toDelete: string[] = [];

    for (const [id, doc] of this.documents.entries()) {
      if (this.matchesFilter(doc, filter)) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      this.documents.delete(id);
    }
    
    console.log(`Deleted ${toDelete.length} documents matching filter`);
  }

  private matchesFilter(doc: VectorDocument, filter: Record<string, unknown>): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (doc.metadata?.[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private calculateSimilarity(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const contentWords = content.toLowerCase().split(/\s+/);

    if (queryWords.length === 0) {
      return 0;
    }

    let matchCount = 0;
    for (const queryWord of queryWords) {
      if (contentWords.some((w) => w.includes(queryWord))) {
        matchCount++;
      }
    }

    return matchCount / queryWords.length;
  }

  getDocumentCount(): number {
    return this.documents.size;
  }

  clear(): void {
    this.documents.clear();
    console.log('Vector store cleared');
  }
}
