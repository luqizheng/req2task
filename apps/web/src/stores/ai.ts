import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { LLMConfigResponse } from '@/api/ai';
import { aiApi } from '@/api';
import type { CreateLLMConfigDto, UpdateLLMConfigDto } from '@req2task/dto';

export const useAiStore = defineStore('ai', () => {
  const configs = ref<LLMConfigResponse[]>([]);
  const currentConfig = ref<LLMConfigResponse | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchConfigs = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await aiApi.getLLMConfigs();
      let data = response;
      if (data && typeof data === 'object' && 'data' in data) {
        data = (data as { data: LLMConfigResponse[] }).data;
      }
      if (Array.isArray(data)) {
        configs.value = data;
        const defaultConfig = data.find(c => c.isDefault);
        if (defaultConfig) {
          currentConfig.value = defaultConfig;
        }
      } else {
        configs.value = [];
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch AI configs';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createConfig = async (data: CreateLLMConfigDto) => {
    isLoading.value = true;
    error.value = null;
    try {
      const newConfig = await aiApi.createLLMConfig(data);
      configs.value.push(newConfig);
      return newConfig;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create AI config';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateConfig = async (id: string, data: UpdateLLMConfigDto) => {
    isLoading.value = true;
    error.value = null;
    try {
      const updatedConfig = await aiApi.updateLLMConfig(id, data);
      const index = configs.value.findIndex(c => c.id === id);
      if (index !== -1) {
        configs.value[index] = updatedConfig;
      }
      if (currentConfig.value?.id === id) {
        currentConfig.value = updatedConfig;
      }
      return updatedConfig;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update AI config';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteConfig = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      await aiApi.deleteLLMConfig(id);
      configs.value = configs.value.filter(c => c.id !== id);
      if (currentConfig.value?.id === id) {
        currentConfig.value = configs.value.find(c => c.isDefault) || null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete AI config';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const setActiveConfig = (config: LLMConfigResponse) => {
    currentConfig.value = config;
  };

  const getActiveConfigId = () => {
    return currentConfig.value?.id;
  };

  const setDefaultConfig = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      await fetch(`/api/ai/llm-configs/${id}/set-default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      configs.value = configs.value.map(c => ({
        ...c,
        isDefault: c.id === id,
      }));
      if (currentConfig.value?.id === id) {
        currentConfig.value = configs.value.find(c => c.id === id) || null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to set default config';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    configs,
    currentConfig,
    isLoading,
    error,
    fetchConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
    setActiveConfig,
    getActiveConfigId,
    setDefaultConfig,
  };
});
