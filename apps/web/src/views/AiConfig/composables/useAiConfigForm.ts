import { reactive, ref } from "vue";
import type { FormRules } from "element-plus";
import {
  type CreateLLMConfigDto,
  type UpdateLLMConfigDto,
  LLMProviderType,
} from "@req2task/dto";
import { providerDefaults, getProviderName, getProviderTagType } from "./useProviderUtils";
import { useAiStore } from "@/stores/ai";
import { ElMessage } from "element-plus";

export interface ConfigFormData {
  name: string;
  provider: string;
  apiKey: string;
  baseUrl: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  isActive: boolean;
  isDefault: boolean;
}

const defaultFormData: ConfigFormData = {
  name: "",
  provider: "deepseek",
  apiKey: "",
  baseUrl: "",
  modelName: "",
  maxTokens: 4096,
  temperature: 0.7,
  topP: 1.0,
  isActive: true,
  isDefault: false,
};

export const useAiConfigForm = () => {
  const aiStore = useAiStore();
  const configForm = reactive<ConfigFormData>({ ...defaultFormData });
  const saving = ref(false);

  const configRules: FormRules = {
    name: [
      { required: true, message: "请输入配置名称", trigger: "blur" },
      { min: 2, max: 32, message: "名称长度 2-32 个字符", trigger: "blur" },
    ],
    provider: [{ required: true, message: "请选择提供商", trigger: "change" }],
    apiKey: [],
    modelName: [
      { required: true, message: "请输入模型名称", trigger: "blur" },
      {
        validator: (
          _rule: unknown,
          value: string,
          callback: (error?: Error) => void,
        ) => {
          if (value.includes(" ")) {
            callback(new Error("模型名称不能包含空格"));
          } else {
            callback();
          }
        },
        trigger: "blur",
      },
    ],
  };

  const resetForm = () => {
    Object.assign(configForm, defaultFormData);
  };

  const applyProviderDefaults = (provider: string) => {
    const defaults = providerDefaults[provider];
    if (defaults) {
      configForm.baseUrl = defaults.baseUrl || "";
      configForm.modelName = defaults.modelName || "";
    }
  };

  const fillFormForEdit = (config: (typeof aiStore.configs)[0]) => {
    Object.assign(configForm, {
      name: config.name,
      provider: config.provider,
      apiKey: "",
      baseUrl: config.baseUrl || "",
      modelName: config.modelName,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      topP: config.topP ?? 1.0,
      isActive: config.isActive,
      isDefault: config.isDefault,
    });
  };

  const saveConfig = async (editingConfigId: string | null) => {
    saving.value = true;
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
        };
        await aiStore.updateConfig(editingConfigId, updateData);
        ElMessage.success("配置更新成功");
      } else {
        const createData: CreateLLMConfigDto = {
          name: configForm.name,
          provider: configForm.provider as LLMProviderType,
          apiKey: configForm.apiKey,
          baseUrl: configForm.baseUrl || undefined,
          modelName: configForm.modelName,
          maxTokens: configForm.maxTokens,
          temperature: configForm.temperature,
          topP: configForm.topP,
          isActive: configForm.isActive,
          isDefault: configForm.isDefault,
        };
        await aiStore.createConfig(createData);
        ElMessage.success("配置创建成功");
      }
      return true;
    } catch (error) {
      ElMessage.error((error as Error).message || "操作失败");
      return false;
    } finally {
      saving.value = false;
    }
  };

  return {
    configForm,
    configRules,
    saving,
    resetForm,
    applyProviderDefaults,
    fillFormForEdit,
    saveConfig,
    getProviderName,
    getProviderTagType,
  };
};
