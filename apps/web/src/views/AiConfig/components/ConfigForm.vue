<script setup lang="ts">
import { ref } from "vue";
import { Check, Close } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import type { ConfigFormData } from "../composables/useAiConfigForm";

defineProps<{
  editingConfigId: string | null;
  saving: boolean;
  configRules: FormRules;
}>();

const configForm = defineModel<ConfigFormData>("configForm", {
  required: true,
});

const formRef = ref<FormInstance>();

const emit = defineEmits<{
  (e: "save", form: FormInstance | undefined): void;
  (e: "cancel"): void;
  (e: "applyDefaults", provider: string): void;
}>();

const handleSave = async () => {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (valid) {
    emit("save", formRef.value);
  }
};

defineExpose({ formRef });
</script>

<template>
  <el-card class="edit-card">
    <template #header>
      <span>{{ editingConfigId ? "编辑配置" : "添加配置" }}</span>
    </template>

    <el-form ref="formRef" :model="configForm" :rules="configRules" label-width="110">
      <el-form-item label="配置名称" prop="name">
        <el-input
          v-model="configForm.name"
          placeholder="请输入配置名称"
          maxlength="32"
          show-word-limit
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="提供商" prop="provider">
            <el-select
              v-model="configForm.provider"
              placeholder="请选择提供商"
              @change="(val: string) => emit('applyDefaults', val)"
            >
              <el-option label="DeepSeek" value="deepseek" />
              <el-option label="OpenAI" value="openai" />
              <el-option label="Ollama" value="ollama" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="模型名称" prop="modelName">
            <el-input
              v-model="configForm.modelName"
              placeholder="如: deepseek-chat"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="API Key" prop="apiKey">
            <el-input
              v-model="configForm.apiKey"
              type="password"
              show-password
              :placeholder="editingConfigId ? '留空则不更新' : '请输入API Key'"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Base URL" prop="baseUrl">
            <el-input
              v-model="configForm.baseUrl"
              placeholder="可选，如使用代理"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="最大Token" prop="maxTokens">
        <el-input-number
          v-model="configForm.maxTokens"
          :min="1"
          :max="100000"
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="温度" prop="temperature">
            <el-slider
              v-model="configForm.temperature"
              :min="0"
              :max="2"
              :step="0.1"
              :format-tooltip="(val: number) => val.toFixed(1)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Top P" prop="topP">
            <el-slider
              v-model="configForm.topP"
              :min="0"
              :max="1"
              :step="0.05"
              :format-tooltip="(val: number) => val.toFixed(2)"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item>
        <el-checkbox v-model="configForm.isActive">启用此配置</el-checkbox>
        <el-checkbox v-model="configForm.isDefault" style="margin-left: 16px"
          >设为默认配置</el-checkbox
        >
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          :icon="Check"
          :loading="saving"
          :disabled="saving"
          @click="handleSave"
        >
          保存
        </el-button>
        <el-button :icon="Close" :disabled="saving" @click="emit('cancel')">
          取消
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.edit-card {
  margin-top: var(--app-space-lg, 24px);
}

:deep(.el-form-item__content) {
  flex-wrap: nowrap;
}

:deep(.el-slider) {
  width: 100%;
}
</style>
