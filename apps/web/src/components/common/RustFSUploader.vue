<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { useRustFS } from "@/composables/useRustFS";
import { fileDataApi } from "@/api";
import { Close } from "@element-plus/icons-vue";

type FileStatus = "uploading" | "success" | "error";

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  status: FileStatus;
  progress: number;
}

interface Props {
  modelValue?: string[];
  accept?: string;
  maxSize?: number;
  maxCount?: number;
  disabled?: boolean;
  tips?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  accept: ".pdf,.docx,.doc,.mp3,.wav,.m4a,.mp4,.png,.jpg,.jpeg",
  maxSize: 50 * 1024 * 1024,
  maxCount: 5,
  disabled: false,
  tips: "支持 PDF、DOCX、音频、图片文件，单个文件不超过 50MB",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void;
  (e: "upload-complete", fileIds: string[]): void;
  (e: "remove", fileId: string): void;
}>();

const { upload, removeFile } = useRustFS();

const fileList = ref<FileItem[]>([]);
const inputRef = ref<HTMLInputElement | null>(null);

const canAddMore = computed(() => fileList.value.length < props.maxCount);

const generateTempId = () =>
  `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const updateFileItem = (id: string, updates: Partial<FileItem>) => {
  const index = fileList.value.findIndex((f) => f.id === id);
  if (index !== -1) {
    fileList.value[index] = { ...fileList.value[index], ...updates };
  }
};

const formatSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith("image/")) return "picture";
  if (mimeType.startsWith("audio/")) return "headset";
  if (mimeType.includes("pdf")) return "document";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "document";
  return "document";
};

const getFileTypeLabel = (mimeType: string): string => {
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word") || mimeType.includes("document")) return "DOCX";
  if (
    mimeType.includes("audio") ||
    mimeType.includes("mpeg") ||
    mimeType.includes("mp3")
  )
    return "音频";
  if (mimeType.startsWith("image/")) return "图片";
  return "文件";
};

watch(
  () => props.modelValue,
  async (newFileIds) => {
    if (!newFileIds || newFileIds.length === 0) {
      fileList.value = [];
      return;
    }

    const existingFileIds = fileList.value.map((f) => f.id);
    const newFileIdSet = new Set(newFileIds);

    fileList.value = fileList.value.filter((f) => newFileIdSet.has(f.id));

    const missingIds = newFileIds.filter((id) => !existingFileIds.includes(id));

    if (missingIds.length > 0) {
      try {
        const { fileDataList } = await fileDataApi.getBatch(missingIds);
        const newFiles = fileDataList.map((file) => ({
          id: file.id,
          name: file.originalName,
          size: file.size,
          type: file.mimeType,
          status: "success" as FileStatus,
          progress: 100,
        }));
        fileList.value = [...fileList.value, ...newFiles];
      } catch (error) {
        console.error("Failed to fetch file data:", error);
      }
    }
  },
  { immediate: true },
);
const syncToModelValue = () => {
  const fileIds = fileList.value
    .filter((file) => file.status === "success" && !file.id.startsWith("temp_"))
    .map((file) => file.id);
  emit("update:modelValue", fileIds);
  emit("upload-complete", fileIds);
};
// watch(
//   () => fileList.value,
//   (newList) => {
//     const fileIds = newList
//       .filter(file => file.status === 'success' && !file.id.startsWith('temp_'))
//       .map(file => file.id);
//     emit('update:modelValue', fileIds);
//     emit('upload-complete', fileIds);
//   },
//   { deep: true }
// );

const handleFileAdd = async (file: File) => {


  if (props.disabled) return;

  if (!canAddMore.value) {
    ElMessage.warning(`最多上传 ${props.maxCount} 个文件`);
    return;
  }

  if (file.size > props.maxSize) {
    ElMessage.warning(
      `文件 ${file.name} 超过大小限制 (${formatSize(props.maxSize)})`,
    );
    return;
  }

  const tempId = generateTempId();

  const newFile: FileItem = {
    id: tempId,
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    status: "uploading",
    progress: 0,
  };

  fileList.value.push(newFile);

  try {
    const uploadedId = await upload(file, (progress) => {
      updateFileItem(tempId, { progress });
    });

    updateFileItem(tempId, {
      id: uploadedId,
      status: "success",
      progress: 100,
    });
    syncToModelValue();
  } catch (error) {
    updateFileItem(tempId, { status: "error" });
    ElMessage.error(`文件 ${file.name} 上传失败`);
  }
};

const handleRemove = async (file: FileItem) => {
  if (props.disabled) return;

  emit("remove", file.id);
  removeFile(file.id);
  
  if (!file.id.startsWith("temp_")) {
    try {
      await fileDataApi.delete(file.id);
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  }
  
  fileList.value = fileList.value.filter((f) => f.id !== file.id);

  syncToModelValue();
};

const triggerUpload = () => {
  if (!props.disabled && canAddMore.value) {
    inputRef.value?.click();
  }
};

const handleInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    Array.from(files).forEach((file) => handleFileAdd(file));
  }
  target.value = "";
};
</script>

<template>
  <div class="rustfs-uploader">
    <div class="file-list">
      <div
        v-for="file in fileList"
        :key="file.id"
        :class="['file-item', file.status]"
      >
        <div class="file-icon">
          <el-icon :size="20"
            ><component :is="getFileIcon(file.type)"
          /></el-icon>
        </div>
        <div class="file-info">
          <div class="file-name">{{ file.name }}</div>
          <div class="file-meta">
            <span v-if="file.size > 0" class="file-type">{{
              getFileTypeLabel(file.type)
            }}</span>
            <span v-if="file.size > 0" class="file-size">{{
              formatSize(file.size)
            }}</span>
          </div>
          <el-progress
            v-if="file.status === 'uploading'"
            :percentage="file.progress"
            :show-text="false"
            :stroke-width="2"
            class="progress-bar"
          />
        </div>
        <div class="file-actions">
          <el-button
            v-if="file.status === 'uploading'"
            :loading="true"
            text
            size="small"
            circle
          />
          <el-button
            v-else
            type="danger"
            size="small"
            circle
            @click="handleRemove(file)"
            :icon="Close"
          >
            
          </el-button>
        </div>
      </div>

      <div
        v-if="canAddMore && !disabled"
        class="upload-trigger"
        @click="triggerUpload"
      >
        <el-icon :size="20"><Plus /></el-icon>
        <span>添加文件</span>
      </div>
    </div>

    <div v-if="tips" class="upload-tips">{{ tips }}</div>

    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      multiple
      class="hidden-input"
      @change="handleInputChange"
    />
  </div>
</template>

<style scoped>
.rustfs-uploader {
  width: 100%;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  font-size: 13px;
  transition: all 0.2s;
}

.file-item.success {
  border-color: #67c23a;
  background: #f0f9eb;
}

.file-item.error {
  border-color: #f56c6c;
  background: #fef0f0;
}

.file-item.uploading {
  border-color: #409eff;
  background: #ecf5ff;
}

.file-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 4px;
  color: #409eff;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.file-meta {
  display: flex;
  gap: 6px;
  margin-top: 2px;
  font-size: 11px;
  color: #909399;
}

.file-type {
  padding: 0 4px;
  background: #e4e7ed;
  border-radius: 3px;
}

.progress-bar {
  margin-top: 4px;
  height: 4px;
}

.file-actions {
  flex-shrink: 0;
}

.remove-icon {
  cursor: pointer;
  color: #909399;
  font-size: 14px;
  transition: color 0.2s;
  padding: 4px;
}

.remove-icon:hover {
  color: #f56c6c;
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 12px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  color: #909399;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}

.upload-trigger:hover {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}

.upload-tips {
  margin-top: 6px;
  font-size: 11px;
  color: #909399;
}

.hidden-input {
  display: none;
}
</style>
