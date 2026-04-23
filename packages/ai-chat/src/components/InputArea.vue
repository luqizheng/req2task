<script setup lang="ts">
import { computed } from "vue";
import {
  UploadFilled,
  Close,
  Document,
  Picture,
  Microphone as Music,
} from "@element-plus/icons-vue";

interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "success" | "error";
  progress?: number;
  url?: string;
}

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  enableFileUpload?: boolean;
  maxFileSize?: number;
  uploadedFiles?: UploadFile[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "输入消息，AI 将实时响应...",
  disabled: false,
  maxLength: 4000,
  enableFileUpload: false,
  maxFileSize: 50 * 1024 * 1024,
  uploadedFiles: () => [],
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "send", content: string): void;
  (
    e: "file-upload",
    file: File,
    onProgress: (percent: number) => void,
  ): Promise<string>;
  (e: "file-remove", fileId: string): void;
}>();

const inputValue = computed({
  get: () => props.modelValue,
  set: (val: string) => emit("update:modelValue", val),
});

const canSend = computed(() => {
  return inputValue.value.trim().length > 0 && !props.disabled;
});

const hasFiles = computed(() => props.uploadedFiles.length > 0);

function handleSend() {
  if (!canSend.value) return;
  emit("send", inputValue.value.trim());
  inputValue.value = "";
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Picture;
  if (type.startsWith("audio/")) return Music;
  return Document;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files || files.length === 0) return;

  for (const file of Array.from(files)) {
    if (file.size > props.maxFileSize) {
      console.warn(`File ${file.name} exceeds size limit`);
      continue;
    }

    try {
      await emit("file-upload", file, (percent) => {
        console.log(`Upload progress: ${percent}%`);
      });
    } catch (error) {
      console.error("File upload failed:", error);
    }
  }

  target.value = "";
}

function handleRemoveFile(file: UploadFile) {
  emit("file-remove", file.id);
}
</script>

<template>
  <div class="input-area">
    <div v-if="enableFileUpload && hasFiles" class="file-preview">
      <div
        v-for="file in uploadedFiles"
        :key="file.id"
        :class="['file-item', file.status]"
      >
        <el-icon class="file-icon">
          <component :is="getFileIcon(file.type)" />
        </el-icon>
        <span class="file-name">{{ file.name }}</span>
        <span class="file-size">{{ formatSize(file.size) }}</span>
        <el-progress
          v-if="file.status === 'uploading'"
          :percentage="file.progress || 0"
          :show-text="false"
          :stroke-width="2"
          class="file-progress"
        />
        <el-icon v-else class="remove-icon" @click="handleRemoveFile(file)">
          <Close />
        </el-icon>
      </div>
    </div>

    <div class="input-wrapper">
      <label
        v-if="enableFileUpload"
        class="upload-btn"
        :class="{ disabled: disabled }"
      >
        <input
          type="file"
          accept=".pdf,.docx,.doc,.mp3,.wav,.m4a,.mp4"
          multiple
          :disabled="disabled"
          @change="handleFileSelect"
        />
        <el-icon><UploadFilled /></el-icon>
      </label>

      <textarea
        v-model="inputValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxLength"
        class="input-textarea"
        rows="1"
        @keydown="handleKeydown"
      />
      <button class="send-button" :disabled="!canSend" @click="handleSend">
        <svg
          v-if="!disabled"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
        <svg
          v-else
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
        </svg>
      </button>
    </div>
    <div v-if="maxLength" class="input-footer">
      <span class="char-count">
        {{ inputValue.length }} / {{ maxLength }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.input-area {
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter, #e4e7ed);
  background: var(--el-fill-color-lightest, #ffffff);
}

.file-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter, #e4e7ed);
}

.file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 6px;
  font-size: 12px;
  position: relative;
}

.file-item.uploading {
  background: var(--el-color-primary-light-9, #ecf5ff);
}

.file-item.error {
  background: var(--el-color-danger-light-9, #fef0f0);
}

.file-icon {
  color: var(--el-color-primary, #409eff);
  font-size: 14px;
}

.file-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary, #303133);
}

.file-size {
  color: var(--el-text-color-secondary, #909399);
}

.file-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 0 0 6px 6px;
}

.remove-icon {
  cursor: pointer;
  color: var(--el-text-color-secondary, #909399);
  font-size: 14px;
  transition: color 0.2s;
}

.remove-icon:hover {
  color: var(--el-color-danger, #f56c6c);
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.upload-btn {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 8px;
  background: var(--el-fill-color, #f5f7fa);
  color: var(--el-text-color-secondary, #909399);
  cursor: pointer;
  transition: all 0.2s;
}

.upload-btn:hover:not(.disabled) {
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}

.upload-btn.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.upload-btn input {
  display: none;
}

.input-textarea {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  font-family: inherit;
  background: var(--el-fill-color, #f5f7fa);
  color: var(--el-text-color-primary, #303133);
}

.input-textarea:focus {
  border-color: var(--el-color-primary, #2563eb);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.input-textarea:disabled {
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-text-color-placeholder, #a0aec0);
  cursor: not-allowed;
}

.input-textarea::placeholder {
  color: var(--el-text-color-placeholder, #a0aec0);
}

.send-button {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: var(--el-color-primary, #2563eb);
  color: white;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.15s;
}

.send-button:hover:not(:disabled) {
  background: var(--el-color-primary-light-1, #3b82f6);
}

.send-button:active:not(:disabled) {
  background: var(--el-color-primary-dark, #1d4ed8);
  transform: scale(0.96);
}

.send-button:disabled {
  background: var(--el-fill-color-dark, #c0c4cc);
  cursor: not-allowed;
}

.input-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.char-count {
  font-size: 11px;
  color: var(--el-text-color-placeholder, #a0aec0);
}
</style>
