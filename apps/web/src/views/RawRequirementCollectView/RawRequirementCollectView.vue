<script setup lang="ts">
import { onMounted, watch, computed } from "vue";
import {
  ArrowLeft,
  Refresh,
  Plus,
  Delete,
  FolderOpened,
  Check,
  Warning,
} from "@element-plus/icons-vue";
import RawRequirementMainPanel from "./components/RawRequirementMainPanel.vue";
import RawRequirementSidebar from "./components/RawRequirementSidebar.vue";
import RequirementChatPanel from "./components/RequirementChatPanel.vue";
import { useCollection, collectionTypeOptions } from "./composables";
import { useRequirementCollectStore } from "@/stores/requirementCollect";
import { CollectionStatus } from "@/api/requirementCollection";

const requirementCollectStore = useRequirementCollectStore();
const {
  projectId,
  collectionId,
  handleBack,
  loadData,
  handleCreate,
  handleDelete,
  handleComplete,
  showCreateDialog,
  createForm,
} = useCollection();

const collections = computed(() => requirementCollectStore.collections);
const currentCollection = computed(
  () => requirementCollectStore.currentCollection,
);
const isLoading = computed(() => requirementCollectStore.isLoading);
const unclarifiedRequirements = computed(
  () => requirementCollectStore.unclarifiedRequirements,
);
const isCollectionActive = computed(
  () => currentCollection.value?.status === CollectionStatus.ACTIVE,
);
const selectedCollectionId = computed({
  get: () => requirementCollectStore.currentCollection?.id || "",
  set: (value: string) => {
    if (value) requirementCollectStore.selectCollection(value);
  },
});

onMounted(() => loadData());
watch([projectId, collectionId], () => {
  loadData();
});
</script>

<template>
  <div class="collect-view">
    <header class="view-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" text @click="handleBack">返回</el-button>
        <h1 class="view-title">需求收集</h1>
      </div>
      <div class="header-actions">
        <el-select
          v-model="selectedCollectionId"
          placeholder="选择收集"
          clearable
          class="collection-select"
        >
          <template #prefix
            ><el-icon><FolderOpened /></el-icon
          ></template>
          <el-option
            v-for="c in collections"
            :key="c.id"
            :label="c.title"
            :value="c.id"
          >
            <div class="collection-option">
              <span class="option-title">{{ c.title }}</span>
              <span class="option-count">{{ c.rawRequirementCount }} 条</span>
              <el-button
                :icon="Delete"
                text
                size="small"
                class="option-delete"
                aria-label="删除收集"
                @click.stop="handleDelete(c.id, c.title)"
              />
            </div>
          </el-option>
        </el-select>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true"
          >新建</el-button
        >
        <el-button :icon="Refresh" @click="loadData" :loading="isLoading"
          >刷新</el-button
        >
      </div>
    </header>

    <div class="view-toolbar" v-if="currentCollection">
      <el-tag size="large" effect="plain">
        {{
          collectionTypeOptions.find(
            (t) => t.value === currentCollection?.collectionType,
          )?.label
        }}
      </el-tag>
      <el-tag
        :type="isCollectionActive ? 'success' : 'info'"
        size="large"
        effect="plain"
      >
        {{ isCollectionActive ? "进行中" : "已完成" }}
      </el-tag>
      <span class="info-text">{{
        currentCollection.collectedBy?.displayName || "未知"
      }}</span>
      <el-button
        v-if="isCollectionActive"
        type="success"
        :icon="Check"
        size="small"
        @click="handleComplete"
        :disabled="unclarifiedRequirements.length > 0"
      >
        完成收集
      </el-button>
      <el-tooltip
        v-if="isCollectionActive && unclarifiedRequirements.length > 0"
        content="所有需求澄清后才能完成收集"
      >
        <el-icon class="warning-icon"><Warning /></el-icon>
      </el-tooltip>
    </div>

    <div class="view-body">
      <aside class="chat-panel">
        <RequirementChatPanel />
      </aside>

      <main class="main-panel">
        <RawRequirementMainPanel />
      </main>

      <aside class="summary-panel">
        <RawRequirementSidebar />
      </aside>
    </div>

    <el-dialog
      v-model="showCreateDialog"
      title="创建需求收集"
      width="420px"
      destroy-on-close
    >
      <el-form :model="createForm" label-width="80">
        <el-form-item label="标题" required>
          <el-input v-model="createForm.title" placeholder="如：Q1 需求调研" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-radio-group v-model="createForm.collectionType">
            <el-radio
              v-for="opt in collectionTypeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="会议纪要">
          <el-input
            v-model="createForm.meetingMinutes"
            type="textarea"
            :rows="3"
            placeholder="可选"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="isLoading"
          >创建</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.collect-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--el-bg-color-page);
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.view-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--el-text-color-primary);
  letter-spacing: -0.01em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions > * {
  margin-left: 4px;
}

.header-actions > *:first-child {
  margin-left: 0;
}

.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-wrap: wrap;
}

.toolbar-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-info .el-tag + .el-tag {
  margin-left: 4px;
}

.toolbar-info .info-text {
  padding-left: 12px;
  border-left: 1px solid var(--el-border-color-lighter);
  margin-left: 4px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-actions .warning-icon {
  margin-left: 8px;
}

.collection-select {
  width: 220px;
  max-width: 100%;
}

.collection-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 4px 0;
}

.option-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.option-count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  flex-shrink: 0;
  padding: 2px 6px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.option-delete {
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.collection-option:hover .option-delete {
  opacity: 1;
}

.info-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.warning-icon {
  color: var(--el-color-warning);
  font-size: 16px;
  vertical-align: middle;
}

.view-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 1px;
  background: var(--el-border-color-lighter);
}

.chat-panel {
  flex: 0 0 320px;
  min-width: 280px;
  max-width: 400px;
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-panel {
  flex: 1;
  min-width: 360px;
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.summary-panel {
  flex: 0 0 360px;
  min-width: 300px;
  max-width: 420px;
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (max-width: 1200px) {
  .chat-panel {
    flex: 0 0 280px;
    min-width: 240px;
  }

  .summary-panel {
    flex: 0 0 300px;
  }

  .main-panel {
    min-width: 320px;
  }
}

@media (max-width: 1024px) {
  .view-body {
    flex-wrap: wrap;
  }

  .chat-panel {
    flex: 1 1 100%;
    min-width: 100%;
    max-height: 260px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    border-right: none;
  }

  .main-panel {
    flex: 1 1 60%;
    min-width: 240px;
  }

  .summary-panel {
    flex: 1 1 40%;
    min-width: 220px;
    max-height: 280px;
  }
}

@media (max-width: 768px) {
  .view-header {
    padding: 16px 16px;
  }

  .header-left {
    gap: 12px;
  }

  .view-title {
    font-size: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .collection-select {
    width: 180px;
  }

  .view-toolbar {
    padding: 10px 16px;
  }

  .toolbar-info {
    gap: 8px;
  }

  .toolbar-info .info-text {
    padding-left: 8px;
  }

  .chat-panel,
  .main-panel,
  .summary-panel {
    flex: 1 1 100%;
    min-width: 100%;
    max-width: 100%;
  }

  .chat-panel,
  .summary-panel {
    max-height: 200px;
  }
}
</style>
