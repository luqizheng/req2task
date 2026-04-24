import { ref } from "vue";
import { ElMessage } from "element-plus";
import { attachmentApi } from "@/api/attachment";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "success" | "error";
  progress: number;
}

export interface UseFileUploadOptions {
  targetType?: "raw_requirement" | "project";
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const uploadedFiles = ref<UploadedFile[]>([]);

  const uploadFile = async (file: File, tempId: string) => {
    try {
      const response = await attachmentApi.upload({
        file,
        targetType: options.targetType || "project",
      });

      const index = uploadedFiles.value.findIndex((f) => f.id === tempId);
      if (index !== -1) {
        uploadedFiles.value = uploadedFiles.value.map((f, i) =>
          i === index
            ? {
                ...f,
                id: response.id,
                status: "success" as const,
                progress: 100,
              }
            : f,
        );
      }
    } catch (error) {
      const index = uploadedFiles.value.findIndex((f) => f.id === tempId);
      if (index !== -1) {
        uploadedFiles.value = uploadedFiles.value.map((f, i) =>
          i === index ? { ...f, status: "error" as const } : f,
        );
      }
      ElMessage.error(`${file.name} 上传失败，请重试`);
    }
  };

  const handleAttachmentSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);

    files.forEach((file) => {
      const uploadedFile: UploadedFile = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
        progress: 0,
      };
      uploadedFiles.value = [...uploadedFiles.value, uploadedFile];
      uploadFile(file, uploadedFile.id);
    });

    target.value = "";
  };

  const removeUploadedFile = (id: string) => {
    uploadedFiles.value = uploadedFiles.value.filter((f) => f.id !== id);
  };

  const getSuccessFileIds = () =>
    uploadedFiles.value
      .filter((f) => f.status === "success" && !f.id.startsWith("temp_"))
      .map((f) => f.id);

  return {
    uploadedFiles,
    handleAttachmentSelect,
    removeUploadedFile,
    getSuccessFileIds,
  };
}
