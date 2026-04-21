<script setup lang="ts">
import { computed } from "vue";
import { FolderOpened } from "@element-plus/icons-vue";
import { useRequirementCollectStore } from "@/stores/requirementCollect";
import { AiSubmit } from "@/components/ai-submit";
import { ElMessage } from "element-plus";

const store = useRequirementCollectStore();

const hasValidCollection = computed(() => !!store.currentCollection?.id);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

const submitUrl = computed(() => {
  if (!store.currentCollection) return "";
  return `${apiBaseUrl}/api/collections/${store.currentCollection.id}/analyze/stream`;
});

const requirementSource = "手动添加";

async function handleSubmitSuccess(_data: unknown) {
  try {
    await store.fetchCollections(store.currentCollection!.projectId);
    await store.selectCollection(store.currentCollection!.id);
    ElMessage.success("需求添加成功");
  } catch {
    ElMessage.error("刷新数据失败");
  }
}

function handleSubmitError(error: Error) {
  ElMessage.error(error.message);
}
</script>

<template>
  <div class="requirement-chat-panel">
    <div class="panel-header">
      <div class="header-title">
        <span class="title-icon">📝</span>
        <span>需求输入</span>
      </div>
    </div>

    <template v-if="hasValidCollection">
      <div class="panel-content">
        <AiSubmit
          :url="submitUrl"
          :upload-file="true"
          :message-key="'content'"
          :extra-data="{ source: requirementSource }"
          placeholder="请输入需求内容..."
          @success="handleSubmitSuccess"
          @error="handleSubmitError"
        />
      </div>
    </template>

    <div v-else class="no-collection-hint">
      <el-icon class="hint-icon"><FolderOpened /></el-icon>
      <p>请先选择或创建需求收集</p>
    </div>
  </div>
</template>

<style scoped>
.requirement-chat-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--el-bg-color);
}

.panel-header {
  padding: 14px 16px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.title-icon {
  font-size: 20px;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.no-collection-hint {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.hint-icon {
  font-size: 48px;
  color: var(--el-text-color-placeholder);
}
</style>
