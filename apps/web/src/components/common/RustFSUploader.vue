<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useRustFS } from '@/composables/useRustFS';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  fileDataId?: string;
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
  accept: '.pdf,.docx,.doc,.mp3,.wav,.m4a,.mp4,.png,.jpg,.jpeg',
  maxSize: 50 * 1024 * 1024,
  maxCount: 5,
  disabled: false,
  tips: '支持 PDF、DOCX、音频、图片文件，单个文件不超过 50MB',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
  (e: 'upload-complete', fileIds: string[]): void;
  (e: 'remove', fileId: string): void;
}>();

const { upload, removeFile } = useRustFS();

const fileList = ref<FileItem[]>([]);

const canAddMore = computed(() => {
  return fileList.value.length < props.maxCount;
});

watch(
  () => props.modelValue,
  (newFileIds) => {
    if (newFileIds && newFileIds.length > 0) {
      fileList.value = newFileIds.map(id => ({
        id,
        name: `文件 ${id.slice(-8)}`,
        size: 0,
        type: 'application/octet-stream',
        status: 'success',
        progress: 100,
      }));
    } else {
      fileList.value = [];
    }
  },
  { immediate: true }
);

watch(
  () => fileList.value,
  (newList) => {
    const fileIds = newList
      .filter(file => file.status === 'success' && !file.id.startsWith('temp_'))
      .map(file => file.id);
    emit('update:modelValue', fileIds);
    emit('upload-complete', fileIds);
  },
  { deep: true }
);

const handleFileAdd = async (file: File) => {
  if (props.disabled) return;

  if (!canAddMore.value) {
    ElMessage.warning(`最多上传 ${props.maxCount} 个文件`);
    return;
  }

  if (file.size > props.maxSize) {
    ElMessage.warning(`文件 ${file.name} 超过大小限制 (${formatSize(props.maxSize)})`);
    return;
  }

  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newFile: FileItem = {
    id: tempId,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    status: 'uploading',
    progress: 0,
  };

  fileList.value = [...fileList.value, newFile];

  try {
    const uploadedId = await upload(file, (progress) => {
      const index = fileList.value.findIndex(f => f.id === tempId);
      if (index !== -1) {
        fileList.value[index] = { ...fileList.value[index], progress };
      }
    });

    const index = fileList.value.findIndex(f => f.id === tempId);
    if (index !== -1) {
      fileList.value[index] = { ...fileList.value[index], id: uploadedId, status: 'success', progress: 100 };
    }
  } catch (error) {
    const index = fileList.value.findIndex(f => f.id === tempId);
    if (index !== -1) {
      fileList.value[index] = { ...fileList.value[index], status: 'error' };
    }
    ElMessage.error(`文件 ${file.name} 上传失败`);
  }
};

const handleRemove = (file: FileItem) => {
  if (props.disabled) return;

  emit('remove', file.id);
  removeFile(file.id);
  fileList.value = fileList.value.filter(f => f.id !== file.id);
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return 'picture';
  if (mimeType.startsWith('audio/')) return 'headset';
  if (mimeType.includes('pdf')) return 'document';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  return 'document';
};

const getFileTypeLabel = (mimeType: string) => {
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCX';
  if (mimeType.includes('audio') || mimeType.includes('mpeg') || mimeType.includes('mp3')) return '音频';
  if (mimeType.startsWith('image/')) return '图片';
  return '文件';
};

const inputRef = ref<HTMLInputElement | null>(null);

const triggerUpload = () => {
  if (!props.disabled && canAddMore.value) {
    inputRef.value?.click();
  }
};

const handleInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    Array.from(files).forEach(file => handleFileAdd(file));
  }
  target.value = '';
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
          <el-icon :size="20"><component :is="getFileIcon(file.type)" /></el-icon>
        </div>
        <div class="file-info">
          <div class="file-name">{{ file.name }}</div>
          <div class="file-meta">
            <span v-if="file.size > 0" class="file-type">{{ getFileTypeLabel(file.type) }}</span>
            <span v-if="file.size > 0" class="file-size">{{ formatSize(file.size) }}</span>
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
          <el-icon
            v-else
            class="remove-icon"
            @click="handleRemove(file)"
          >
            <Close />
          </el-icon>
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