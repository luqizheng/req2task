import { defineStore } from "pinia";
import { ref } from "vue";

export type CollectionType = "meeting" | "interview" | "document" | "other";

export interface Collection {
  id: string;
  title: string;
  type: CollectionType;
  collectedAt: Date;
  source?: string;
}

export interface RawRequirement {
  id: string;
  content: string;
  source?: string;
  status: "pending" | "processing" | "completed" | "clarified" | "converted" | "discarded" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

export interface ConflictInfo {
  id: string;
  type: "duplicate" | "contradiction" | "dependency";
  description: string;
  relatedRequirements: string[];
}

export interface AnalysisResult {
  conflicts: ConflictInfo[];
  suggestions: string[];
  summary: string;
}

export const useRequirementCollectStore = defineStore("requirementCollect", () => {
  const currentCollection = ref<Collection | null>(null);
  const rawRequirements = ref<RawRequirement[]>([]);
  const analysisResult = ref<AnalysisResult | null>(null);
  const isLoading = ref(false);

  const setCurrentCollection = (collection: Collection | null) => {
    currentCollection.value = collection;
  };

  const addRawRequirement = (requirement: RawRequirement) => {
    rawRequirements.value.push(requirement);
  };

  const updateRawRequirement = (id: string, updates: Partial<RawRequirement>) => {
    const index = rawRequirements.value.findIndex((r) => r.id === id);
    if (index !== -1) {
      rawRequirements.value[index] = { ...rawRequirements.value[index], ...updates };
    }
  };

  const removeRawRequirement = (id: string) => {
    rawRequirements.value = rawRequirements.value.filter((r) => r.id !== id);
  };

  const setAnalysisResult = (result: AnalysisResult | null) => {
    analysisResult.value = result;
  };

  const setLoading = (loading: boolean) => {
    isLoading.value = loading;
  };

  const reset = () => {
    currentCollection.value = null;
    rawRequirements.value = [];
    analysisResult.value = null;
    isLoading.value = false;
  };

  return {
    currentCollection,
    rawRequirements,
    analysisResult,
    isLoading,
    setCurrentCollection,
    addRawRequirement,
    updateRawRequirement,
    removeRawRequirement,
    setAnalysisResult,
    setLoading,
    reset,
  };
});
