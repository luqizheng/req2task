<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Plus, Edit, Delete, Check, Close, Setting } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAiStore } from '@/stores/ai';
import type { CreateLLMConfigDto, UpdateLLMConfigDto } from '@req2task/dto';
import { LLMProviderType } from '@req2task/core';

const aiStore = useAiStore();
const loading = ref(false);
const isEditing = ref(false);
const editingConfigId = ref<string | null>(null);

const configFormRef = ref<FormInstance>();

const defaultFormData = {
  name: '',
  provider: 'deepseek' as string,
  apiKey: '',
  baseUrl: '',
  modelName: '',
  maxTokens: 4096,
  temperature: 0.7,
  isActive: true,
  isDefault: false,
};

const configForm = reactive({ ...defaultFormData });

const configRules: FormRules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  provider: [{ required: true, message: '请选择提供商', trigger: 'change' }],
  apiKey: [{ required: true, message: '请输入API Key', trigger: 'blur' }],
  modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
};

const getProviderName = (provider: string) => {
  const map: Record<string, string> = {
    [LLMProviderType.DEEPSEEK]: 'DeepSeek',
    [LLMProviderType.OPENAI]: 'OpenAI',
    [LLMProviderType.OLLAMA]: 'Ollama',
  };
  return map[provider] || provider;
};

const getProviderTagType = (provider: string) => {
  const map: Record<string, string> = {
    [LLMProviderType.DEEPSEEK]: 'primary',
    [LLMProviderType.OPENAI]: 'success',
    [LLMProviderType.OLLAMA]: 'warning',
  };
  return map[provider] || '';
};

const maskApiKey = (apiKey?: string) => {
  if (!apiKey || apiKey.length < 8) return '****';
  return apiKey.substring(0, 4) + '****' + apiKey.substring(apiKey.length - 4);
};

const resetForm = () => {
  Object.assign(configForm, defaultFormData);
};

const handleAdd = () => {
  resetForm();
  editingConfigId.value = null;
  isEditing.value = true;
};

const handleEdit = (config: typeof aiStore.configs[0]) => {
  Object.assign(configForm, {
    name: config.name,
    provider: config.provider,
    apiKey: '',
    baseUrl: config.baseUrl || '',
    modelName: config.modelName,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
    isActive: config.isActive,
    isDefault: config.isDefault,
  });
  editingConfigId.value = config.id;
  isEditing.value = true;
};

const handleCancel = () => {
  isEditing.value = false;
  editingConfigId.value = null;
  resetForm();
};

const handleSave = async () => {
  if (!configFormRef.value) return;
  await configFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (editingConfigId.value) {
          const updateData: UpdateLLMConfigDto = {
            name: configForm.name,
            apiKey: configForm.apiKey || undefined,
            baseUrl: configForm.baseUrl || undefined,
            modelName: configForm.modelName,
            maxTokens: configForm.maxTokens,
            temperature: configForm.temperature,
            isActive: configForm.isActive,
            isDefault: configForm.isDefault,
          };
          await aiStore.updateConfig(editingConfigId.value, updateData);
          ElMessage.success('配置更新成功');
        } else {
          const createData: CreateLLMConfigDto = {
            name: configForm.name,
            provider: configForm.provider as LLMProviderType,
            apiKey: configForm.apiKey,
            baseUrl: configForm.baseUrl || undefined,
            modelName: configForm.modelName,
            maxTokens: configForm.maxTokens,
            temperature: configForm.temperature,
            isActive: configForm.isActive,
            isDefault: configForm.isDefault,
          };
          await aiStore.createConfig(createData);
          ElMessage.success('配置创建成功');
        }
        handleCancel();
      } catch (error) {
        ElMessage.error((error as Error).message || '操作失败');
      }
    }
  });
};

const handleDelete = async (config: typeof aiStore.configs[0]) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除配置"${config.name}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    await aiStore.deleteConfig(config.id);
    ElMessage.success('删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error((error as Error).message || '删除失败');
    }
  }
};

const handleSetDefault = async (config: typeof aiStore.configs[0]) => {
  try {
    await aiStore.updateConfig(config.id, { isDefault: true });
    await aiStore.fetchConfigs();
    ElMessage.success('已设置为默认配置');
  } catch (error) {
    ElMessage.error((error as Error).message || '设置失败');
  }
};

const handleSetActive = async (config: typeof aiStore.configs[0]) => {
  try {
    await aiStore.updateConfig(config.id, { isActive: true });
    await aiStore.fetchConfigs();
    ElMessage.success('已激活配置');
  } catch (error) {
    ElMessage.error((error as Error).message || '激活失败');
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    await aiStore.fetchConfigs();
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="ai-config-view">
    <div class="page-header">
      <h2 class="page-title">AI 配置管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd" :disabled="isEditing">
        添加配置
      </el-button>
    </div>

    <div class="config-content">
      <el-card v-loading="loading">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Setting /></el-icon>
              LLM 配置列表
            </span>
          </div>
        </template>

        <div v-if="aiStore.configs.length === 0 && !isEditing" class="empty-state">
          <el-empty description="暂无AI配置，请点击添加按钮创建">
            <el-button type="primary" @click="handleAdd">添加配置</el-button>
          </el-empty>
        </div>

        <div v-else class="config-list">
          <el-row :gutter="16">
            <el-col
              v-for="config in aiStore.configs"
              :key="config.id"
              :xs="24"
              :sm="12"
              :lg="8"
            >
              <el-card class="config-card" shadow="hover">
                <template #header>
                  <div class="config-header">
                    <div class="config-name">
                      <span>{{ config.name }}</span>
                      <el-tag v-if="config.isDefault" size="small" type="success">
                        默认
                      </el-tag>
                      <el-tag v-if="!config.isActive" size="small" type="info">
                        停用
                      </el-tag>
                    </div>
                    <div class="config-actions">
                      <el-button
                        type="primary"
                        :icon="Edit"
                        size="small"
                        text
                        @click="handleEdit(config)"
                        :disabled="isEditing"
                      />
                      <el-button
                        type="danger"
                        :icon="Delete"
                        size="small"
                        text
                        @click="handleDelete(config)"
                        :disabled="isEditing"
                      />
                    </div>
                  </div>
                </template>

                <div class="config-info">
                  <div class="info-item">
                    <span class="info-label">提供商：</span>
                    <el-tag :type="getProviderTagType(config.provider)" size="small">
                      {{ getProviderName(config.provider) }}
                    </el-tag>
                  </div>
                  <div class="info-item">
                    <span class="info-label">模型：</span>
                    <span class="info-value">{{ config.modelName }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">API Key：</span>
                    <span class="info-value">{{ maskApiKey(config.apiKey) }}</span>
                  </div>
                  <div class="info-item" v-if="config.baseUrl">
                    <span class="info-label">Base URL：</span>
                    <span class="info-value">{{ config.baseUrl }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">参数：</span>
                    <span class="info-value">
                      maxTokens: {{ config.maxTokens }}, temp: {{ config.temperature }}
                    </span>
                  </div>
                </div>

                <div class="config-footer">
                  <el-button
                    v-if="!config.isDefault"
                    size="small"
                    @click="handleSetDefault(config)"
                    :disabled="isEditing"
                  >
                    设为默认
                  </el-button>
                  <el-button
                    v-if="!config.isActive"
                    size="small"
                    type="success"
                    @click="handleSetActive(config)"
                    :disabled="isEditing"
                  >
                    激活
                  </el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <el-card v-if="isEditing" class="edit-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              {{ editingConfigId ? '编辑配置' : '添加配置' }}
            </span>
            <el-button :icon="Close" @click="handleCancel">取消</el-button>
          </div>
        </template>

        <el-form
          ref="configFormRef"
          :model="configForm"
          :rules="configRules"
          label-width="100"
        >
          <el-form-item label="配置名称" prop="name">
            <el-input v-model="configForm.name" placeholder="请输入配置名称" />
          </el-form-item>

          <el-form-item label="提供商" prop="provider">
            <el-select v-model="configForm.provider" placeholder="请选择提供商">
              <el-option label="DeepSeek" value="deepseek" />
              <el-option label="OpenAI" value="openai" />
              <el-option label="Ollama" value="ollama" />
            </el-select>
          </el-form-item>

          <el-form-item label="模型名称" prop="modelName">
            <el-input v-model="configForm.modelName" placeholder="如: deepseek-chat" />
          </el-form-item>

          <el-form-item label="API Key" prop="apiKey">
            <el-input
              v-model="configForm.apiKey"
              type="password"
              show-password
              :placeholder="editingConfigId ? '留空则不更新' : '请输入API Key'"
            />
          </el-form-item>

          <el-form-item label="Base URL" prop="baseUrl">
            <el-input
              v-model="configForm.baseUrl"
              placeholder="可选，如使用代理"
            />
          </el-form-item>

          <el-form-item label="最大Token" prop="maxTokens">
            <el-input-number v-model="configForm.maxTokens" :min="1" :max="100000" />
          </el-form-item>

          <el-form-item label="温度" prop="temperature">
            <el-slider
              v-model="configForm.temperature"
              :min="0"
              :max="2"
              :step="0.1"
              :format-tooltip="(val: number) => val.toFixed(1)"
            />
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="configForm.isActive">启用此配置</el-checkbox>
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="configForm.isDefault">设为默认配置</el-checkbox>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :icon="Check"
              :loading="aiStore.isLoading"
              @click="handleSave"
            >
              保存
            </el-button>
            <el-button :icon="Close" @click="handleCancel">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.ai-config-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.config-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.empty-state {
  padding: 40px 0;
}

.config-list {
  min-height: 200px;
}

.config-card {
  margin-bottom: 16px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.config-actions {
  display: flex;
  gap: 4px;
}

.config-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  color: #64748b;
  font-size: 14px;
  min-width: 80px;
}

.info-value {
  color: #1e293b;
  font-size: 14px;
  word-break: break-all;
}

.config-footer {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.edit-card {
  margin-top: 20px;
}
</style>
