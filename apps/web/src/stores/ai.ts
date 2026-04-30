import { defineStore } from 'pinia'
import { ref } from 'vue'
import { llmConfigApi, type LLMConfigResponse } from '@/api/llm-config'
import type { CreateLLMConfigDto, UpdateLLMConfigDto } from '@req2task/dto'

export const useAiStore = defineStore('ai', () => {
  const configs = ref<LLMConfigResponse[]>([])
  const isLoading = ref(false)

  const fetchConfigs = async () => {
    isLoading.value = true
    try {
      const response = await llmConfigApi.getConfigs()
      configs.value = response.configs || []
    } finally {
      isLoading.value = false
    }
  }

  const createConfig = async (data: CreateLLMConfigDto) => {
    const response = await llmConfigApi.createConfig(data)
    await fetchConfigs()
    return response
  }

  const updateConfig = async (id: string, data: UpdateLLMConfigDto) => {
    const response = await llmConfigApi.updateConfig(id, data)
    await fetchConfigs()
    return response
  }

  const deleteConfig = async (id: string) => {
    await llmConfigApi.deleteConfig(id)
    await fetchConfigs()
  }

  return {
    configs,
    isLoading,
    fetchConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
  }
})
