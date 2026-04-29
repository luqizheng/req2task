<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRustFS } from "@/composables/useRustFS";
import { fileDataApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "vue-sonner";
import {
  FileText,
  FileImage,
  FileAudio,
  File,
  X,
  Plus,
  Loader2,
} from "lucide-vue-next";

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

const getFileIconComponent = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("word") || mimeType.includes("document")) return FileText;
  return File;
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

const handleFileAdd = async (file: File) => {
  if (props.disabled) return;

  if (!canAddMore.value) {
    toast.warning(`最多上传 ${props.maxCount} 个文件`);
    return;
  }

  if (file.size > props.maxSize) {
    toast.warning(
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
    toast.error(`文件 ${file.name} 上传失败`);
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
  <div class="w-full">
    <div class="flex flex-col gap-2">
      <div
        v-for="file in fileList"
        :key="file.id"
        :class="[
          'flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-[13px] transition-all',
          file.status === 'success' && 'border-green-500/50 bg-green-50/50',
          file.status === 'error' && 'border-red-500/50 bg-red-50/50',
          file.status === 'uploading' && 'border-blue-500/50 bg-blue-50/50',
        ]"
      >
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-white">
          <component
            :is="getFileIconComponent(file.type)"
            class="h-5 w-5 text-blue-500"
          />
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate font-medium text-gray-800">
            {{ file.name }}
          </div>
          <div class="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500">
            <span v-if="file.size > 0" class="rounded bg-gray-100 px-1 py-0.5">
              {{ getFileTypeLabel(file.type) }}
            </span>
            <span v-if="file.size > 0">{{ formatSize(file.size) }}</span>
          </div>
          <Progress
            v-if="file.status === 'uploading'"
            :model-value="file.progress"
            class="mt-1.5 h-1"
          />
        </div>
        <div class="shrink-0">
          <div v-if="file.status === 'uploading'" class="p-1">
            <Loader2 class="h-4 w-4 animate-spin text-blue-500" />
          </div>
          <Button
            v-else
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-gray-500 hover:text-red-500"
            @click="handleRemove(file)"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        v-if="canAddMore && !disabled"
        class="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-4 text-xs text-gray-500 transition-all hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-500"
        @click="triggerUpload"
      >
        <Plus class="h-5 w-5" />
        <span>添加文件</span>
      </div>
    </div>

    <div v-if="tips" class="mt-1.5 text-[11px] text-gray-500">
      {{ tips }}
    </div>

    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      multiple
      class="hidden"
      @change="handleInputChange"
    />
  </div>
</template>
