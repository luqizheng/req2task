<script setup lang="ts">
import { Edit, Delete } from "@element-plus/icons-vue";
import type { LLMConfigResponseDto } from "@req2task/dto";
import { getProviderName, getProviderTagType, maskApiKey } from "../composables/useProviderUtils";

defineProps<{
  config: LLMConfigResponseDto;
  isEditing: boolean;
  deletingId: string | null;
  actionLoadingId: string | null;
}>();

const emit = defineEmits<{
  edit: [config: LLMConfigResponseDto];
  delete: [config: LLMConfigResponseDto];
  setDefault: [config: LLMConfigResponseDto];
  setActive: [config: LLMConfigResponseDto];  
}>();
</script>

<template>
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
        <div class="config-actions" role="group" aria-label="配置操作">
          <el-button
            type="primary"
            :icon="Edit"
            size="small"
            text
            @click="emit('edit', config)"
            :disabled="isEditing"
            aria-label="编辑配置"
          />
          <el-button
            type="danger"
            :icon="Delete"
            size="small"
            text
            @click="emit('delete', config)"
            :disabled="isEditing || deletingId === config.id"
            :loading="deletingId === config.id"
            aria-label="删除配置"
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
          maxTokens: {{ config.maxTokens }}, temp:
          {{ config.temperature }}, topP: {{ config.topP ?? 1 }}
        </span>
      </div>
    </div>

    <div class="config-footer">
      <el-button
        v-if="!config.isDefault"
        size="small"
        @click="emit('setDefault', config)"
        :disabled="isEditing || actionLoadingId === config.id"
        :loading="actionLoadingId === config.id"
      >
        设为默认
      </el-button>
      <el-button
        v-if="!config.isActive"
        size="small"
        type="success"
        @click="emit('setActive', config)"
        :disabled="isEditing || actionLoadingId === config.id"
        :loading="actionLoadingId === config.id"
      >
        激活
      </el-button>
    </div>
  </el-card>
</template>

<style scoped>
.config-card {
  height: 100%;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.config-card:hover {
  transform: translateY(-2px);
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--app-space-sm, 8px);
}

.config-name {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs, 6px);
  font-weight: 600;
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-primary);
  min-width: 0;
  overflow: hidden;
  flex: 1;
}

.config-name > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.config-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.config-actions :deep(.el-button) {
  opacity: 0.65;
  transition: opacity 0.15s ease;
}

.config-actions :deep(.el-button:hover) {
  opacity: 1;
}

.config-info {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-sm, 10px);
  padding: var(--app-space-sm, 10px) 0;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-xs, 6px);
  line-height: 1.5;
}

.info-label {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  min-width: 72px;
  flex-shrink: 0;
}

.info-value {
  color: var(--el-text-color-regular);
  font-size: var(--el-font-size-small);
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
}

.config-footer {
  display: flex;
  gap: var(--app-space-sm, 8px);
  padding-top: var(--app-space-sm, 10px);
  margin-top: var(--app-space-sm, 10px);
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
