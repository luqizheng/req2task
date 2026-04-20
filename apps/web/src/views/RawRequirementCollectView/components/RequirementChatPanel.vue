<script setup lang="ts">
import { ref, computed } from 'vue';
import { AIChat } from '@req2task/ai-chat';
import '@req2task/ai-chat/dist/style.css'
import { ElMessage } from 'element-plus';
import { useRequirementCollectStore, MAX_QUESTION_COUNT } from '@/stores/requirementCollect';
import { useAiStore } from '@/stores/ai';
import { attachmentApi } from '@/api/attachment';

interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
}

const store = useRequirementCollectStore();
const aiStore = useAiStore();

const chatRef = ref<InstanceType<typeof AIChat> | null>(null);
const uploadedFiles = ref<UploadFile[]>([]);

const activeConfigId = computed(() => aiStore.getActiveConfigId());

const isIndependentSession = computed(() => !!store.currentRawRequirementId);

const questionProgress = computed(() => {
  if (!isIndependentSession.value) return null;
  return {
    current: store.currentQuestionCount,
    max: MAX_QUESTION_COUNT,
    percentage: Math.min((store.currentQuestionCount / MAX_QUESTION_COUNT) * 100, 100),
  };
});

const chatConfig = computed(() => ({
  baseURL: '/api/ai',
  headers: activeConfigId.value ? { 'X-AI-Config-Id': activeConfigId.value } : undefined,
}));

async function handleFileUpload(file: File, onProgress: (percent: number) => void): Promise<string> {
  if (!store.currentCollection) {
    throw new Error('请先选择或创建需求收集');
  }

  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newFile: UploadFile = {
    id: tempId,
    name: file.name,
    size: file.size,
    type: file.type,
    status: 'uploading',
    progress: 0,
  };

  uploadedFiles.value = [...uploadedFiles.value, newFile];

  try {
    const result = await attachmentApi.upload({
      file,
      targetType: 'collection',
      targetId: store.currentCollection.id,
      displayName: file.name,
    });

    const index = uploadedFiles.value.findIndex(f => f.id === tempId);
    if (index !== -1) {
      uploadedFiles.value[index] = {
        ...uploadedFiles.value[index],
        id: result.id,
        status: 'success',
        progress: 100,
      };
    }

    onProgress(100);
    return result.id;
  } catch (error) {
    const index = uploadedFiles.value.findIndex(f => f.id === tempId);
    if (index !== -1) {
      uploadedFiles.value[index] = {
        ...uploadedFiles.value[index],
        status: 'error',
      };
    }
    throw error;
  }
}

function handleFileRemove(fileId: string) {
  uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== fileId);

  if (!fileId.startsWith('temp_')) {
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
          :color="questionProgress.current >= MAX_QUESTION_COUNT ? '#67c23a' : '#409eff'"
        />
        <span class="progress-count">{{ questionProgress.current }}/{{ questionProgress.max }}</span>
      </div>
    </div>

    <AIChat
      ref="chatRef"
      :config="chatConfig"
      adapter-name="requirement-collect"
      title="AI 需求分析"
      placeholder="输入需求内容或上传文件..."
      :max-height="'100%'"
      :show-window-header="false"
      :enable-file-upload="true"
      :uploaded-files="uploadedFiles"
      @file-upload="handleFileUpload"
      @file-remove="handleFileRemove"
    />
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
</style>
