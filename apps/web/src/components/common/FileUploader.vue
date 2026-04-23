<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { Plus, Close } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { UploadRawFile } from 'element-plus';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  rawFile?: File;
}

interface Props {
  modelValue?: FileItem[];
  accept?: string;
  maxSize?: number;
  maxCount?: number;
  disabled?: boolean;
  tips?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  accept: '.pdf,.docx,.doc,.mp3,.wav,.m4a,.mp4',
  maxSize: 50 * 1024 * 1024,
  maxCount: 5,
  disabled: false,
  tips: '支持 PDF、DOCX、音频文件，单个文件不超过 50MB',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: FileItem[]): void;
  (e: 'upload', file: File, onProgress: (percent: number) => void): Promise<string>;
  (e: 'remove', fileId: string): void;
}>();

const fileList = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const uploading = ref(false);

const DocumentIcon = () => h('svg', { viewBox: '0 0 1024 1024', width: '1em', height: '1em' }, [
  h('path', { d: 'M854 096v704h-704V192h704v704zM512 160H192v704h704V544H512V160z m96 112v64H416v-64h192z m0 160v64H416v-64h192z', fill: 'currentColor' })
]);

const ImageIcon = () => h('svg', { viewBox: '0 0 1024 1024', width: '1em', height: '1em' }, [
  h('path', { d: 'M928 160H96c-18 0-32 14-32 32v640c0 18 14 32 32 32h832c18 0 32-14 32-32V192c0-18-14-32-32-32z m-40 632H132V232h756v560z', fill: 'currentColor' }),
  h('path', { d: 'M224 408c31 0 56-25 56-56s-25-56-56-56-56 25-56 56 25 56 56 56z m0-80c13 0 24 11 24 24s-11 24-24 24-24-11-24-24 11-24 24-24z m656 80H144c-9 0-16-7-16-16v-16c0-35 29-64 64-64h656c35 0 64 29 64 64v16c0 9-7 16-16 16z', fill: 'currentColor' })
]);

const AudioIcon = () => h('svg', { viewBox: '0 0 1024 1024', width: '1em', height: '1em' }, [
  h('path', { d: 'M512 64c-18 0-32 14-32 32v384c0 18 14 32 32 32s32-14 32-32V96c0-18-14-32-32-32z m352 256H672c-9 0-16 7-16 16s7 16 16 16h192c9 0 16-7 16-16V176c0-26-22-48-48-48H544c-9 0-16-7-16-16s7-16 16-16h320c53 0 96 43 96 96v256c0 53-43 96-96 96z', fill: 'currentColor' })
]);

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.startsWith('audio/')) return AudioIcon;
  return DocumentIcon;
};

const getFileTypeLabel = (mimeType: string) => {
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCX';
  if (mimeType.includes('audio') || mimeType.includes('mpeg') || mimeType.includes('mp3')) return '音频';
  return '文件';
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const canAddMore = computed(() => {
  return fileList.value.length < props.maxCount;
});

const handleFileAdd = async (uploadFile: UploadRawFile) => {
  if (props.disabled || uploading.value) return;

  if (!canAddMore.value) {
    ElMessage.warning(`最多上传 ${props.maxCount} 个文件`);
    return false;
  }

  if (uploadFile.size > props.maxSize) {
    ElMessage.warning(`文件 ${uploadFile.name} 超过大小限制 (${formatSize(props.maxSize)})`);
    return false;
  }

  const acceptedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a'];
  const fileType = uploadFile.type || '';

  if (fileType && !acceptedTypes.includes(fileType)) {
    ElMessage.warning('仅支持 PDF、DOCX、音频文件');
    return false;
  }

  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newFile: FileItem = {
    id: tempId,
    name: uploadFile.name,
    size: uploadFile.size,
    type: fileType || 'application/octet-stream',
    status: 'uploading',
    progress: 0,
    rawFile: uploadFile as unknown as File,
  };

  fileList.value = [...fileList.value, newFile];
  uploading.value = true;

  try {
    const onProgress = (percent: number) => {
      const index = fileList.value.findIndex(f => f.id === tempId);
      if (index !== -1) {
        const updated = [...fileList.value];
        updated[index] = { ...updated[index], progress: percent };
        fileList.value = updated;
      }
    };

    const uploadedId = await emit('upload', uploadFile as unknown as File, onProgress);

    const index = fileList.value.findIndex(f => f.id === tempId);
    if (index !== -1) {
      const updated = [...fileList.value];
      updated[index] = { ...updated[index], id: uploadedId, status: 'success', progress: 100 };
      fileList.value = updated;
    }
  } catch (error) {
    const index = fileList.value.findIndex(f => f.id === tempId);
    if (index !== -1) {
      const updated = [...fileList.value];
      updated[index] = { ...updated[index], status: 'error' };
      fileList.value = updated;
    }
    ElMessage.error(`文件 ${uploadFile.name} 上传失败`);
  } finally {
    uploading.value = false;
  }

  return false;
};

const handleRemove = (file: FileItem) => {
  if (props.disabled) return;

  if (file.status === 'success' && !file.id.startsWith('temp_')) {
    emit('remove', file.id);
  }

  fileList.value = fileList.value.filter(f => f.id !== file.id);
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
    Array.from(files).forEach(file => {
      handleFileAdd({
        uid: Date.now(),
        name: file.name,
        size: file.size,
        percentage: 0,
        rawFile: file,
        status: 'ready',
      } as any);
    });
  }
  target.value = '';
};
</script>

<template>
  <div class="file-uploader">
    <div class="file-list">
      <div
        v-for="file in fileList"
        :key="file.id"
        :class="['file-item', file.status]"
      >
        <div class="file-icon">
          <el-icon :size="24">
            <component :is="getFileIcon(file.type)" />
          </el-icon>
        </div>
        <div class="file-info">
          <div class="file-name">{{ file.name }}</div>
          <div class="file-meta">
            <span class="file-type">{{ getFileTypeLabel(file.type) }}</span>
            <span class="file-size">{{ formatSize(file.size) }}</span>
          </div>
          <el-progress
            v-if="file.status === 'uploading'"
            :percentage="file.progress"
            :show-text="false"
            :stroke-width="2"
          />
        </div>
        <div class="file-actions">
          <el-button
            v-if="file.status === 'uploading'"
            :loading="true"
            text
            size="small"
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
        <el-icon :size="24"><Plus /></el-icon>
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
.file-uploader {
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
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
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
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  color: #409eff;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.file-type {
  padding: 1px 6px;
  background: #e4e7ed;
  border-radius: 4px;
}

.file-actions {
  flex-shrink: 0;
}

.remove-icon {
  cursor: pointer;
  color: #909399;
  font-size: 16px;
  transition: color 0.2s;
}

.remove-icon:hover {
  color: #f56c6c;
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  color: #909399;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-trigger:hover {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}

.upload-trigger span {
  font-size: 13px;
}

.upload-tips {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.hidden-input {
  display: none;
}
</style>
