export interface VectorDocument {
  id: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface VectorStore {
  add(documents: VectorDocument[]): Promise<void>;
  search(query: string, limit?: number): Promise<SearchResult[]>;
  delete(ids: string[]): Promise<void>;
  deleteByFilter(filter: Record<string, any>): Promise<void>;
}
