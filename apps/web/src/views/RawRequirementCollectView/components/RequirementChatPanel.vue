<script setup lang="ts">
import { ref, computed } from "vue";
import { FolderOpened } from "@element-plus/icons-vue";
import { AIChat } from "@req2task/ai-chat";
import "@req2task/ai-chat/dist/style.css";
import {
  useRequirementCollectStore,
  MAX_QUESTION_COUNT,
} from "@/stores/requirementCollect";
import { useAiStore } from "@/stores/ai";
import { useUserStore } from "@/stores/user";
import { attachmentApi } from "@/api/attachment";
import { req2taskAdapter } from "@/adapters/req2task";
import { registerAdapter } from "@req2task/ai-chat";

interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "success" | "error";
  progress?: number;
}

registerAdapter(req2taskAdapter);
const store = useRequirementCollectStore();
const aiStore = useAiStore();
const userStore = useUserStore();

const uploadedFiles = ref<UploadFile[]>([]);

const activeConfigId = computed(() => aiStore.getActiveConfigId());

const isIndependentSession = computed(() => !!store.currentRawRequirementId);

const questionProgress = computed(() => {
  if (!isIndependentSession.value) return null;
  return {
    current: store.currentQuestionCount,
    max: MAX_QUESTION_COUNT,
    percentage: Math.min(
      (store.currentQuestionCount / MAX_QUESTION_COUNT) * 100,
      100,
    ),
  };
});

const hasValidCollection = computed(() => !!store.currentCollection?.id);

const chatConfig = computed(() => {
  if (!hasValidCollection.value) return { endpoint: "" };
  const headers: Record<string, string> = {};
  if (activeConfigId.value) headers["X-AI-Config-Id"] = activeConfigId.value;
  if (userStore.token) headers["Authorization"] = `Bearer ${userStore.token}`;
  return {
    endpoint: `/api/collections/${store.currentCollection!.id}/analyze/stream`,
    headers: Object.keys(headers).length ? headers : undefined,
  };
});

async function handleFileUpload(
  file: File,
  onProgress: (percent: number) => void,
): Promise<string> {
  if (!store.currentCollection) {
    throw new Error("请先选择或创建需求收集");
  }

  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newFile: UploadFile = {
    id: tempId,
    name: file.name,
    size: file.size,
    type: file.type,
    status: "uploading",
    progress: 0,
  };

  uploadedFiles.value = [...uploadedFiles.value, newFile];

  try {
    const result = await attachmentApi.upload({
      file,
      targetType: "collection",
      targetId: store.currentCollection.id,
      displayName: file.name,
    });

    const index = uploadedFiles.value.findIndex((f) => f.id === tempId);
    if (index !== -1) {
      uploadedFiles.value[index] = {
        ...uploadedFiles.value[index],
        id: result.id,
        status: "success",
        progress: 100,
      };
    }

    onProgress(100);
    return result.id;
  } catch (error) {
    const index = uploadedFiles.value.findIndex((f) => f.id === tempId);
    if (index !== -1) {
      uploadedFiles.value[index] = {
        ...uploadedFiles.value[index],
        status: "error",
      };
    }
    throw error;
  }
}

function handleFileRemove(fileId: string) {
  uploadedFiles.value = uploadedFiles.value.filter((f) => f.id !== fileId);

  if (!fileId.startsWith("temp_")) {
    attachmentApi.delete(fileId).catch(() => {});
  }
}
</script>

<template>
  <div class="requirement-chat-panel">
    <div class="panel-header">
      <div class="header-title">
        <span class="title-icon">💬</span>
        <span>AI 对话</span>
      </div>
      <div v-if="questionProgress" class="header-progress">
        <span class="progress-label">追问进度</span>
        <el-progress
          :percentage="questionProgress.percentage"
          :show-text="false"
          :stroke-width="3"
          :color="
            questionProgress.current >= MAX_QUESTION_COUNT
              ? '#67c23a'
              : '#409eff'
          "
        />
        <span class="progress-count"
          >{{ questionProgress.current }}/{{ questionProgress.max }}</span
        >
      </div>
    </div>

    <template v-if="hasValidCollection">
      <AIChat
        ref="chatRef"
        :config="chatConfig"
        adapter-name="req2task"
        title="AI 需求分析"
        placeholder="输入需求内容或上传文件..."
        :max-height="'100%'"
        :show-window-header="false"
        :enable-file-upload="true"
        :uploaded-files="uploadedFiles"
        @file-upload="handleFileUpload"
        @file-remove="handleFileRemove"
      />
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
  margin-bottom: 14px;
}

.title-icon {
  font-size: 20px;
}

.header-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.progress-count {
  font-size: 12px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.header-progress :deep(.el-progress) {
  flex: 1;
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
