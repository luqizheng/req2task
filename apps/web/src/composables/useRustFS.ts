/**
 * 文件上传 Composable
 * @description
 * 提供文件上传功能，先上传文件到后端服务，获取fileDataId，
 * 然后在业务提交时创建附件关联。
 *
 * @example
 * ```typescript
 * // 基础用法
 * const { upload, uploadingFiles } = useRustFS();
 *
 * const handleFileSelect = async (event: Event) => {
 *   const file = (event.target as HTMLInputElement).files?.[0];
 *   if (file) {
 *     const attachmentId = await upload(file, 'project', projectId);
 *     console.log('上传成功，附件ID:', attachmentId);
 *   }
 * };
 *
 * // 带进度回调
 * const attachmentId = await upload(file, 'project', projectId, (progress) => {
 *   console.log('上传进度:', progress);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // 获取下载链接
 * const { getDownloadUrl } = useRustFS();
 *
 * const downloadFile = async (fileDataId: string) => {
 *   const url = await getDownloadUrl(fileDataId);
 *   window.open(url, '_blank');
 * };
 * ```
 *
 * @example
 * ```typescript
 * // 监听上传状态
 * const { uploadingFiles } = useRustFS();
 *
 * // 在模板中使用
 * <template>
 *   <div v-for="[id, file] in uploadingFiles" :key="id">
 *     <span>{{ file.name }}</span>
 *     <span>{{ file.status }}</span>
 *     <span>{{ file.progress }}%</span>
 *   </div>
 * </template>
 * ```
 *
 * @remarks
 * 上传流程：
 * 1. 调用后端 /file-data/upload 接口上传文件
 * 2. 上传成功后调用附件创建接口
 *
 * 支持的 targetType: 'collection' | 'raw_requirement' | 'project'
 */

import { ref } from 'vue';
import api from '@/api/axios';

export interface UploadedFile {
  /** 附件 ID，上传成功后返回 */
  id: string;
  /** 文件名 */
  name: string;
  /** 文件大小（字节） */
  size: number;
  /** MIME 类型 */
  type: string;
  /** 上传状态 */
  status: 'uploading' | 'success' | 'error';
  /** 上传进度 0-100 */
  progress: number;
  /** 文件数据 ID */
  fileDataId?: string;
}

export interface CreateAttachmentByFileDataIdDto {
  /** 文件数据 ID */
  fileDataId: string;
  /** 关联目标类型 */
  targetType: 'collection' | 'raw_requirement' | 'project';
  /** 关联目标 ID */
  targetId?: string;
  /** 显示名称 */
  displayName?: string;
  /** 描述 */
  description?: string;
  /** 原始文件名 */
  fileName: string;
  /** MIME 类型 */
  contentType: string;
  /** 文件大小（字节） */
  size: number;
}

export function useRustFS() {
  const uploadingFiles = ref<Map<string, UploadedFile>>(new Map());

  /**
   * 上传文件到后端服务
   * @param file - 要上传的文件
   * @param onProgress - 进度回调函数 (0-100)
   * @returns 文件数据 ID
   */
  const upload = async (
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<string> => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    uploadingFiles.value.set(tempId, {
      id: tempId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
    });

    try {
      // 上传文件到 file-data/upload 接口
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await api.post<{ fileDataId: string }>(
        '/file-data/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress?.(progress);
              
              const uploadFile = uploadingFiles.value.get(tempId);
              if (uploadFile) {
                uploadFile.progress = progress;
                uploadingFiles.value.set(tempId, uploadFile);
              }
            }
          },
        }
      );

      const { fileDataId } = uploadResponse;

      const uploadSuccess = uploadingFiles.value.get(tempId);
      if (uploadSuccess) {
        uploadSuccess.id = fileDataId;
        uploadSuccess.fileDataId = fileDataId;
        uploadSuccess.status = 'success';
        uploadSuccess.progress = 100;
        uploadingFiles.value.set(tempId, uploadSuccess);
      }
      onProgress?.(100);

      return fileDataId;
    } catch (error) {
      const uploadError = uploadingFiles.value.get(tempId);
      if (uploadError) {
        uploadError.status = 'error';
        uploadingFiles.value.set(tempId, uploadError);
      }
      throw error;
    }
  };

  /**
   * 创建附件关联
   * @param dto - 附件创建参数
   * @returns 包含附件 ID 的响应
   */
  /**
   * 获取文件下载 URL
   * @param fileDataId - 文件数据 ID
   * @returns 预签名下载 URL
   */
  const getDownloadUrl = async (fileDataId: string): Promise<string> => {
    const response = await api.get<{
      code: number;
      data: { presignedUrl: string };
    }>(`/rustfs/presign-get/${encodeURIComponent(fileDataId)}`);
    return (response.data as { presignedUrl: string }).presignedUrl;
  };

  /**
   * 移除上传状态跟踪
   * @param fileId - 文件 ID
   */
  const removeFile = (fileId: string): void => {
    uploadingFiles.value.delete(fileId);
  };

  return {
    upload,
    getDownloadUrl,
    uploadingFiles,
    removeFile,
  };
}