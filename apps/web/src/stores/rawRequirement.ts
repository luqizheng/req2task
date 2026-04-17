import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { RawRequirementResponse } from '@/api/ai';
import type { GenerateRequirementResponse } from '@req2task/dto';

export interface RawCollection {
  id: string;
  moduleId: string;
  name: string;
  description?: string;
  requirements: RawRequirementResponse[];
  createdAt: string;
  updatedAt: string;
}

export const useRawRequirementStore = defineStore('rawRequirement', () => {
  const collections = ref<RawCollection[]>([]);
  const currentCollection = ref<RawCollection | null>(null);
  const requirements = ref<RawRequirementResponse[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchCollectionsByModule = async (moduleId: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await fetch(`/api/ai/modules/${moduleId}/raw-requirements`, {
        headers: { 'Content-Type': 'application/json' },
      }).then(res => res.json());
      requirements.value = result.data || [];
      return requirements.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch raw requirements';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createCollection = async (moduleId: string, name: string, description?: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const newCollection: RawCollection = {
        id: crypto.randomUUID(),
        moduleId,
        name,
        description,
        requirements: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      collections.value.push(newCollection);
      return newCollection;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create collection';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const selectCollection = (collection: RawCollection | null) => {
    currentCollection.value = collection;
    if (collection) {
      requirements.value = collection.requirements;
    }
  };

  const fetchRequirements = async (moduleId: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await fetch(`/api/ai/modules/${moduleId}/raw-requirements`, {
        headers: { 'Content-Type': 'application/json' },
      }).then(res => res.json());
      requirements.value = result.data || [];
      return requirements.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch requirements';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const addRequirement = async (moduleId: string, content: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await fetch(`/api/ai/modules/${moduleId}/raw-requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      }).then(res => res.json());
      const newRequirement: RawRequirementResponse = {
        id: result.data?.id || crypto.randomUUID(),
        moduleId,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      requirements.value.push(newRequirement);
      return newRequirement;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add requirement';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateRequirement = (id: string, content: string) => {
    const index = requirements.value.findIndex(r => r.id === id);
    if (index !== -1) {
      requirements.value[index] = {
        ...requirements.value[index],
        content,
        updatedAt: new Date().toISOString(),
      };
    }
  };

  const deleteRequirement = (id: string) => {
    requirements.value = requirements.value.filter(r => r.id !== id);
  };

  const generateFromRaw = async (
    id: string,
    configId?: string
  ): Promise<GenerateRequirementResponse> => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await fetch(`/api/ai/raw-requirements/${id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId }),
      }).then(res => res.json());
      return result.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to generate requirement';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    collections,
    currentCollection,
    requirements,
    isLoading,
    error,
    fetchCollectionsByModule,
    createCollection,
    selectCollection,
    fetchRequirements,
    addRequirement,
    updateRequirement,
    deleteRequirement,
    generateFromRaw,
    clearError,
  };
});
