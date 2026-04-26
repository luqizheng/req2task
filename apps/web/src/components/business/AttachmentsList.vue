<template>
  <el-card shadow="never">
    <template #header>
      <div style="display: flex; flex-direction: row; align-items: center">
        <h1 style="flex: 9">附件</h1>
        <AppBadge :value="props.attachments.length" type="info" />
      </div>
    </template>

    <div v-if="props.attachments.length > 0">
      <div
        v-for="attachment in props.attachments"
        :key="attachment.id"
        class="attachment-item"
      >
        <div class="file-icon">
          <el-icon>
            <Document />
          </el-icon>
        </div>
        <div class="file-info">
          <div class="file-name">{{ attachment.displayName }}</div>
          <div class="file-meta">
            {{ formatFileSize(attachment.size) }} ·
            {{ getFileExtension(attachment.mimeType) }}
          </div>
        </div>
        <el-button
          type="text"
          size="small"
          @click="handleDownload(attachment.id, attachment.displayName)"
        >
          <el-icon>
            <Download />
          </el-icon>
        </el-button>
      </div>
    </div>
    <div v-else class="empty-attachments">
      <AppEmpty description="暂无附件" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
defineExpose({});
import { AttachmentResponseDto } from "@req2task/dto";
import { Document, Download } from "@element-plus/icons-vue";
import { AppBadge, AppEmpty } from "@/components/common";
import { attachmentApi } from "@/api/attachment";
import { ElMessage } from "element-plus";

const props = defineProps<{
  attachments: AttachmentResponseDto[];
}>();

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const getFileExtension = (mimeType: string): string => {
  const extensions: Record<string, string> = {
    "application/pdf": "PDF",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "DOCX",
    "application/vnd.ms-excel": "XLS",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "application/vnd.ms-powerpoint": "PPT",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "PPTX",
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/gif": "GIF",
    "text/plain": "TXT",
    "application/json": "JSON",
    "application/zip": "ZIP",
  };
  return extensions[mimeType] || "文件";
};

const handleDownload = async (id: string, fileName: string) => {
  try {
    const blob = await attachmentApi.download(id);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    ElMessage.error("下载失败，请重试");
    console.error("Download error:", error);
  }
};
</script>

<style scoped>
.attachment-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background-color: rgba(250, 250, 250, 1);
  border: 1px solid rgba(232, 232, 232, 1);
  border-radius: 4px;
  margin-bottom: 8px;
  transition: background-color 0.3s;
}

.attachment-item:hover {
  background-color: rgba(245, 245, 245, 1);
}

.file-icon {
  margin-right: 10px;
  color: #606266;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: rgba(13, 13, 13, 1);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 12px;
  color: rgba(176, 176, 176, 1);
}

.empty-attachments {
  padding: 40px 0;
  text-align: center;
}
</style>
