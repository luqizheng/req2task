<script setup lang="ts">
import { ref, computed } from "vue";
import { Plus, Setting } from "@element-plus/icons-vue";
import { useAiStore } from "@/stores/ai";
import type { LLMConfigResponse } from "@/api/ai";
import { useAiConfig } from "./composables/useAiConfig";
import { useAiConfigForm } from "./composables/useAiConfigForm";
import ConfigCard from "./components/ConfigCard.vue";
import ConfigForm from "./components/ConfigForm.vue";

const aiStore = useAiStore();

const {
  loading,
  deletingId,
  actionLoadingId,
  deleteConfig,
  setDefault,
  setActive,
} = useAiConfig();

const {
  configForm,
  configRules,
  saving,
  resetForm,
  applyProviderDefaults,
  fillFormForEdit,
  saveConfig,
} = useAiConfigForm();

const drawerVisible = ref(false);
const editingConfigId = ref<string | null>(null);
const configFormRef = ref<InstanceType<typeof ConfigForm>>();

const drawerTitle = computed(() =>
  editingConfigId.value ? "编辑配置" : "添加配置"
);

const handleAdd = () => {
  resetForm();
  applyProviderDefaults(configForm.provider);
  editingConfigId.value = null;
  drawerVisible.value = true;
};

const handleEdit = (config: LLMConfigResponse) => {
  fillFormForEdit(config);
  editingConfigId.value = config.id;
  drawerVisible.value = true;
};

const handleClose = () => {
  drawerVisible.value = false;
  editingConfigId.value = null;
  resetForm();
};

const handleSave = async () => {
  const success = await saveConfig(editingConfigId.value);
  if (success) {
    handleClose();
  }
};
</script>

<template>
  <div class="ai-config-view">
    <div class="page-header">
      <h2 class="page-title">AI 配置管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">
        添加配置
      </el-button>
    </div>

    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Setting /></el-icon>
            LLM 配置列表
          </span>
        </div>
      </template>

      <div
        v-if="aiStore.configs.length === 0"
        class="empty-state"
      >
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
            <ConfigCard
              :config="config"
              :is-editing="drawerVisible"
              :deleting-id="deletingId"
              :action-loading-id="actionLoadingId"
              @edit="handleEdit"
              @delete="deleteConfig"
              @set-default="setDefault"
              @set-active="setActive"
            />
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-drawer
      v-model="drawerVisible"
      :title="drawerTitle"
      direction="rtl"
      size="480px"
      :before-close="handleClose"
    >
      <ConfigForm
        ref="configFormRef"
        :editing-config-id="editingConfigId"
        :config-form="configForm"
        :config-rules="configRules"
        :saving="saving"
        @save="handleSave"
        @cancel="handleClose"
        @apply-defaults="applyProviderDefaults"
      />
    </el-drawer>
  </div>
</template>

<style scoped>
:host {
  --focus-ring: 0 0 0 2px var(--el-color-primary);
}

.ai-config-view {
  padding: var(--app-padding-base, 24px);
  max-width: 1400px;
  margin: 0 auto;
}

:global(:focus-visible) {
  outline: none;
  box-shadow: var(--focus-ring);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--app-space-lg, 24px);
}

.page-title {
  font-size: var(--el-font-size-large);
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: var(--el-font-size-base);
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.empty-state {
  padding: var(--app-space-xl, 32px) 0;
}

.config-list {
  min-height: 200px;
}
</style>
