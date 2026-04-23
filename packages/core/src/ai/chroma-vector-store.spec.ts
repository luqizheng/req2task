import { ChromaVectorStore } from './chroma-vector-store';
import { VectorDocument } from './vector-store.interface';

describe('ChromaVectorStore', () => {
  let store: ChromaVectorStore;

  beforeEach(() => {
    store = new ChromaVectorStore();
  });

  describe('add', () => {
    it('should add documents to store', async () => {
      const documents: VectorDocument[] = [
        { id: '1', content: 'Test document 1' },
        { id: '2', content: 'Test document 2' },
      ];

      await store.add(documents);

      expect(store.getDocumentCount()).toBe(2);
    });

    it('should overwrite existing documents with same id', async () => {
      const doc1: VectorDocument = { id: '1', content: 'Original content' };
      const doc2: VectorDocument = { id: '1', content: 'Updated content' };

      await store.add([doc1]);
      await store.add([doc2]);

      expect(store.getDocumentCount()).toBe(1);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      const documents: VectorDocument[] = [
        { id: '1', content: 'JavaScript is a programming language' },
        { id: '2', content: 'TypeScript is a typed superset of JavaScript' },
        { id: '3', content: 'Python is a popular language' },
        { id: '4', content: 'Java is used for enterprise applications' },
      ];
      await store.add(documents);
    });

    it('should return matching documents sorted by score', async () => {
      const results = await store.search('JavaScript', 5);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('1');
      expect(results[0].content).toContain('JavaScript');
    });

    it('should respect limit parameter', async () => {
      const results = await store.search('programming', 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array for non-matching query', async () => {
      const results = await store.search('xyz123nonexistent', 5);

      expect(results.length).toBe(0);
    });

    it('should return results with metadata', async () => {
      const docsWithMetadata: VectorDocument[] = [
        { id: 'meta1', content: 'Document with metadata', metadata: { category: 'test', version: '1.0' } },
      ];
      await store.add(docsWithMetadata);

      const results = await store.search('metadata', 5);
      const result = results.find(r => r.id === 'meta1');

      expect(result?.metadata).toEqual({ category: 'test', version: '1.0' });
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      const documents: VectorDocument[] = [
        { id: '1', content: 'Document 1' },
        { id: '2', content: 'Document 2' },
        { id: '3', content: 'Document 3' },
      ];
      await store.add(documents);
    });

    it('should delete specified documents', async () => {
      await store.delete(['1', '2']);

      expect(store.getDocumentCount()).toBe(1);
    });

    it('should handle deleting non-existent documents', async () => {
      await store.delete(['nonexistent']);

      expect(store.getDocumentCount()).toBe(3);
    });
  });

  describe('deleteByFilter', () => {
    beforeEach(async () => {
      const documents: VectorDocument[] = [
        { id: '1', content: 'Doc 1', metadata: { category: 'a' } },
        { id: '2', content: 'Doc 2', metadata: { category: 'b' } },
        { id: '3', content: 'Doc 3', metadata: { category: 'a' } },
      ];
      await store.add(documents);
    });

    it('should delete documents matching filter', async () => {
      await store.deleteByFilter({ category: 'a' });

      expect(store.getDocumentCount()).toBe(1);
    });

    it('should delete documents matching multiple filter criteria', async () => {
      const docsWithMultipleFilters: VectorDocument[] = [
        { id: 'multi1', content: 'Multi doc', metadata: { category: 'x', status: 'active' } },
        { id: 'multi2', content: 'Multi doc 2', metadata: { category: 'x', status: 'inactive' } },
      ];
      await store.add(docsWithMultipleFilters);

      await store.deleteByFilter({ category: 'x', status: 'active' });

      expect(store.getDocumentCount()).toBe(4);
    });
  });

  describe('clear', () => {
    it('should clear all documents', async () => {
      const documents: VectorDocument[] = [
        { id: '1', content: 'Document 1' },
        { id: '2', content: 'Document 2' },
      ];
      await store.add(documents);

      store.clear();

      expect(store.getDocumentCount()).toBe(0);
    });
  });

  describe('getDocumentCount', () => {
    it('should return correct count', async () => {
      expect(store.getDocumentCount()).toBe(0);

      await store.add([{ id: '1', content: 'Doc 1' }]);
      expect(store.getDocumentCount()).toBe(1);

      await store.add([{ id: '2', content: 'Doc 2' }]);
      expect(store.getDocumentCount()).toBe(2);
    });
  });
});
