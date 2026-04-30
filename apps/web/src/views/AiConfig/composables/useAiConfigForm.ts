import { reactive, ref } from 'vue'
import type { CreateLLMConfigDto, UpdateLLMConfigDto, LLMProviderType } from '@req2task/dto'
import { providerDefaults, getProviderName, getProviderClass } from './useProviderUtils'
import { useAiStore } from '@/stores/ai'
import { toast } from 'vue-sonner'

export interface ConfigFormData {
  name: string
  provider: string
  apiKey: string
  baseUrl: string
  modelName: string
  maxTokens: number
  temperature: number
  topP: number
  isActive: boolean
  isDefault: boolean
}

export interface FormRules {
  name?: { required?: boolean; message?: string; min?: number; max?: number; trigger?: string }[]
  provider?: { required?: boolean; message?: string; trigger?: string }[]
  apiKey?: { required?: boolean; message?: string }[]
  modelName?: { required?: boolean; message?: string; trigger?: string }[]
}

const defaultFormData: ConfigFormData = {
  name: '',
  provider: 'deepseek',
  apiKey: '',
  baseUrl: '',
  modelName: '',
  maxTokens: 4096,
  temperature: 0.7,
  topP: 1.0,
  isActive: true,
  isDefault: false,
}

export const useAiConfigForm = () => {
  const aiStore = useAiStore()
  const configForm = reactive<ConfigFormData>({ ...defaultFormData })
  const saving = ref(false)

  const configRules: FormRules = {
    name: [
      { required: true, message: '请输入配置名称', trigger: 'blur' },
      { min: 2, max: 32, message: '名称长度 2-32 个字符', trigger: 'blur' },
    ],
    provider: [{ required: true, message: '请选择提供商', trigger: 'change' }],
    apiKey: [],
    modelName: [
      { required: true, message: '请输入模型名称', trigger: 'blur' },
    ],
  }

  const resetForm = () => {
    Object.assign(configForm, defaultFormData)
  }

  const applyProviderDefaults = (provider: string) => {
    const defaults = providerDefaults[provider]
    if (defaults) {
      configForm.baseUrl = defaults.baseUrl || ''
      configForm.modelName = defaults.modelName || ''
    }
  }

  const fillFormForEdit = (config: {
    name: string
    provider: string
    baseUrl?: string | null
    modelName: string
    maxTokens: number
    temperature: number
    topP?: number
    isActive: boolean
    isDefault: boolean
  }) => {
    Object.assign(configForm, {
      name: config.name,
      provider: config.provider,
      apiKey: '',
      baseUrl: config.baseUrl || '',
      modelName: config.modelName,
      maxTokens: Number(config.maxTokens),
      temperature: Number(config.temperature),
      topP: Number(config.topP ?? 1.0),
      isActive: config.isActive,
      isDefault: config.isDefault,
    })
  }

  const saveConfig = async (editingConfigId: string | null) => {
    saving.value = true
    try {
      if (editingConfigId) {
        const updateData: UpdateLLMConfigDto = {
          name: configForm.name,
          apiKey: configForm.apiKey || undefined,
          baseUrl: configForm.baseUrl || undefined,
          modelName: configForm.modelName,
          maxTokens: configForm.maxTokens,
          temperature: configForm.temperature,
          topP: configForm.topP,
          isActive: configForm.isActive,
          isDefault: configForm.isDefault,
        }
        await aiStore.updateConfig(editingConfigId, updateData)
        toast.success('配置更新成功')
      } else {
        const createData: CreateLLMConfigDto = {
          name: configForm.name,
          provider: configForm.provider as unknown as LLMProviderType,
          apiKey: configForm.apiKey,
          baseUrl: configForm.baseUrl || undefined,
          modelName: configForm.modelName,
          maxTokens: configForm.maxTokens,
          temperature: configForm.temperature,
          topP: configForm.topP,
          isActive: configForm.isActive,
          isDefault: configForm.isDefault,
        }
        await aiStore.createConfig(createData)
        toast.success('配置创建成功')
      }
      return true
    } catch (error) {
      toast.error((error as Error).message || '操作失败')
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    configForm,
    configRules,
    saving,
    resetForm,
    applyProviderDefaults,
    fillFormForEdit,
    saveConfig,
    getProviderName,
    getProviderClass,
  }
}
