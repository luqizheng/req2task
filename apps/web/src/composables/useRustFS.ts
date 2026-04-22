/**
 * RustFS 文件直传 Composable
 * @description
 * 提供客户端直传 RustFS (S3 兼容对象存储) 的能力，文件直接上传到对象存储，
 * 后端仅管理元数据和附件关联。
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
 * 1. 调用后端接口获取 presigned URL
 * 2. 使用 fetch PUT 直接上传到 RustFS
 * 3. 上传成功后调用附件创建接口
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
  /** RustFS 存储路径 */
  fileDataId?: string;
}

export interface PresignPutResponse {
  /** 预签名上传 URL */
  presignedUrl: string;
  /** RustFS 存储路径 */
  fileDataId: string;
  /** URL 过期时间（秒） */
  expiresIn: number;
}

export interface CreateAttachmentByFileDataIdDto {
  /** RustFS 存储路径 */
  fileDataId: string;
  /** 关联目标类型 */
  targetType: 'collection' | 'raw_requirement' | 'project';
  /** 关联目标 ID */
  targetId?: string;
  /** 显示名称 */
  displayName?: string;
  /** 描述 */
  description?: string;
}

export function useRustFS() {
  const uploadingFiles = ref<Map<string, UploadedFile>>(new Map());

  /**
   * 获取预签名上传 URL
   * @param fileName - 文件名
   * @param contentType - MIME 类型
   * @returns 包含 presignedUrl、fileDataId、expiresIn 的响应
   */
  const getPresignedUrl = async (
    fileName: string,
    contentType: string,
  ): Promise<PresignPutResponse> => {
    const response = await api.get<{ code: number; data: PresignPutResponse }>(
      '/rustfs/presign-put',
      {
        params: { fileName, contentType },
      },
    );
    return response.data as PresignPutResponse;
  };

  /**
   * 上传文件到 RustFS
   * @param file - 要上传的文件
   * @param targetType - 关联目标类型 ('collection' | 'raw_requirement' | 'project')
   * @param targetId - 关联目标 ID
   * @param onProgress - 进度回调函数 (0-100)
   * @returns 附件 ID
   */
  const upload = async (
    file: File,
    targetType: string,
    targetId?: string,
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
      const { presignedUrl, fileDataId } = await getPresignedUrl(
        file.name,
        file.type,
      );

      const upload30 = uploadingFiles.value.get(tempId);
      if (upload30) {
        upload30.progress = 30;
        uploadingFiles.value.set(tempId, upload30);
      }
      onProgress?.(30);

      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const upload70 = uploadingFiles.value.get(tempId);
      if (upload70) {
        upload70.progress = 70;
        uploadingFiles.value.set(tempId, upload70);
      }
      onProgress?.(70);

      const attachment = await createAttachment({
        fileDataId,
        targetType: targetType as 'collection' | 'raw_requirement' | 'project',
        targetId,
        displayName: file.name,
      });

      const uploadSuccess = uploadingFiles.value.get(tempId);
      if (uploadSuccess) {
        uploadSuccess.id = attachment.id;
        uploadSuccess.fileDataId = fileDataId;
        uploadSuccess.status = 'success';
        uploadSuccess.progress = 100;
        uploadingFiles.value.set(tempId, uploadSuccess);
      }
      onProgress?.(100);

      return attachment.id;
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
  const createAttachment = async (
    dto: CreateAttachmentByFileDataIdDto,
  ): Promise<{ id: string }> => {
    const response = await api.post<{ code: number; data: { id: string } }>(
      '/attachments/create',
      dto,
    );
    return response.data as { id: string };
  };

  /**
   * 获取文件下载 URL
   * @param fileDataId - RustFS 存储路径
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
   * @param id - 临时 ID 或附件 ID
   */
  const removeFile = (id: string) => {
    uploadingFiles.value.delete(id);
  };

  /** 清空所有上传状态 */
  const clearFiles = () => {
    uploadingFiles.value.clear();
  };

  return {
    /** 当前上传中的文件 Map */
    uploadingFiles,
    /** 获取预签名上传 URL */
    getPresignedUrl,
    /** 上传文件 */
    upload,
    /** 创建附件关联 */
    createAttachment,
    /** 获取下载 URL */
    getDownloadUrl,
    /** 移除文件 */
    removeFile,
    /** 清空所有文件 */
    clearFiles,
  };
}
