<script setup lang="ts">
import { computed, ref } from "vue";
import { FolderOpened } from "@element-plus/icons-vue";
import { useRequirementCollectStore } from "@/stores/requirementCollect";
import { useAiSubmit } from "@/composables/useAiSubmit";
import { ElMessage } from "element-plus";
import { Microphone, Upload, Paperclip, Close, Promotion } from "@element-plus/icons-vue";

const store = useRequirementCollectStore();

const hasValidCollection = computed(() => !!store.currentCollection?.id);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

const submitUrl = computed(() => {
  if (!store.currentCollection) return "";
  return `${apiBaseUrl}/api/collections/${store.currentCollection.id}/raw-requirements`;
});

const requirementSource = "手动添加";

const audioInputRef = ref<HTMLInputElement | null>(null);
const attachmentInputRef = ref<HTMLInputElement | null>(null);

const {
  message,
  audioFile,
  uploadedFiles,
  isSubmitting,
  isRecording,
  canSubmit,
  startRecording,
  stopRecording,
  handleAudioFileSelect,
  handleAttachmentSelect,
  removeUploadedFile,
  clearAudio,
  reset,
} = useAiSubmit({
  url: submitUrl.value,
  uploadFile: true,
  audit: false,
  onSuccess: handleSubmitSuccess,
  onError: handleSubmitError,
});

async function handleSubmitSuccess(_data: unknown) {
  try {
    await store.fetchCollections(store.currentCollection!.projectId);
    await store.selectCollection(store.currentCollection!.id);
    reset();
    ElMessage.success("需求添加成功");
  } catch {
    ElMessage.error("刷新数据失败");
  }
}

function handleSubmitError(error: Error) {
  ElMessage.error(error.message);
}

async function handleSubmit() {
  if (!canSubmit.value || !store.currentCollection) {
    if (!store.currentCollection) {
      ElMessage.warning("请先选择或创建需求收集");
    }
    return;
  }

  isSubmitting.value = true;

  try {
    const formData = new FormData();
    formData.append("content", message.value.trim());
    formData.append("source", requirementSource);

    if (audioFile.value) {
      formData.append("audio", audioFile.value);
    }

    const successfulUploads = uploadedFiles.value
      .filter((f) => f.status === "success" && !f.id.startsWith("temp_"))
      .map((f) => f.id);

    if (successfulUploads.length > 0) {
      formData.append("attachments", JSON.stringify(successfulUploads));
    }

    const token = localStorage.getItem("accessToken");
    const response = await fetch(submitUrl.value, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    await response.json();
    await handleSubmitSuccess(null);
  } catch (error) {
    const err = error instanceof Error ? error : new Error("提交失败");
    handleSubmitError(err);
  } finally {
    isSubmitting.value = false;
  }
}

const handleRecordClick = () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording();
  }
};

const triggerAudioSelect = () => {
  audioInputRef.value?.click();
};

const triggerAttachmentSelect = () => {
  attachmentInputRef.value?.click();
};

const handleCancel = () => {
  reset();
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};
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
        <div class="ai-submit">
          <div class="input-section">
            <el-input
              v-model="message"
              type="textarea"
              :rows="3"
              placeholder="请输入需求内容..."
              resize="none"
              :disabled="isSubmitting"
            />
          </div>

          <div class="toolbar">
            <div class="toolbar-left">
              <el-button
                :type="isRecording ? 'danger' : 'default'"
                :icon="isRecording ? Close : Microphone"
                size="small"
                :disabled="isSubmitting || !!audioFile"
                @click="handleRecordClick"
              >
                {{ isRecording ? "停止" : "录音" }}
              </el-button>

              <el-button
                text
                size="small"
                :disabled="isSubmitting || !!audioFile || isRecording"
                @click="triggerAudioSelect"
              >
                <el-icon class="tool-icon"><Upload /></el-icon>
                音频文件
              </el-button>

              <el-button
                text
                size="small"
                :disabled="isSubmitting"
                @click="triggerAttachmentSelect"
              >
                <el-icon class="tool-icon"><Paperclip /></el-icon>
                附件
              </el-button>
            </div>
          </div>

          <div v-if="audioFile" class="audio-preview">
            <div class="file-item">
              <div class="file-icon">
                <el-icon :size="20"><Microphone /></el-icon>
              </div>
              <div class="file-info">
                <div class="file-name">{{ audioFile.name }}</div>
                <div class="file-meta">
                  <span class="file-size">{{ formatSize(audioFile.size) }}</span>
                  <span class="file-type">音频</span>
                </div>
              </div>
              <el-icon class="remove-icon" @click="clearAudio"><Close /></el-icon>
            </div>
          </div>

          <div v-if="uploadedFiles.length > 0" class="attachment-list">
            <div
              v-for="file in uploadedFiles"
              :key="file.id"
              :class="['file-item', file.status]"
            >
              <div class="file-icon">
                <el-icon :size="20"><Paperclip /></el-icon>
              </div>
              <div class="file-info">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-meta">
                  <span class="file-size">{{ formatSize(file.size) }}</span>
                  <span class="file-type">附件</span>
                </div>
                <el-progress
                  v-if="file.status === 'uploading'"
                  :percentage="file.progress"
                  :show-text="false"
                  :stroke-width="2"
                />
              </div>
              <el-icon
                v-if="file.status !== 'uploading'"
                class="remove-icon"
                @click="removeUploadedFile(file.id)"
              >
                <Close />
              </el-icon>
              <el-icon v-else class="loading-icon"><Upload /></el-icon>
            </div>
          </div>

          <div class="actions">
            <el-button size="default" @click="handleCancel" :disabled="isSubmitting">
              取消
            </el-button>
            <el-button
              type="primary"
              :icon="Promotion"
              :disabled="!canSubmit"
              :loading="isSubmitting"
              @click="handleSubmit"
            >
              提交
            </el-button>
          </div>

          <input
            ref="audioInputRef"
            type="file"
            accept="audio/*"
            class="hidden-input"
            @change="handleAudioFileSelect"
          />
          <input
            ref="attachmentInputRef"
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.xlsx,.xls,.txt"
            class="hidden-input"
            @change="handleAttachmentSelect"
          />
        </div>
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

.ai-submit {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.input-section :deep(.el-textarea__inner) {
  border: none;
  padding: 0;
  font-size: 14px;
}

.input-section :deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tool-icon {
  margin-right: 4px;
}

.audio-preview,
.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--el-fill-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.file-item.success {
  border-color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.file-item.error {
  border-color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.file-item.uploading {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.file-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color);
  border-radius: 6px;
  color: var(--el-color-primary);
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.file-type {
  padding: 1px 6px;
  background: var(--el-fill-color-dark);
  border-radius: 4px;
}

.remove-icon {
  flex-shrink: 0;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  font-size: 16px;
  transition: color 0.2s;
}

.remove-icon:hover {
  color: var(--el-color-danger);
}

.loading-icon {
  flex-shrink: 0;
  color: var(--el-color-primary);
  font-size: 16px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

.hidden-input {
  display: none;
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
