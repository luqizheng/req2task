import api from './axios';

export type AttachmentTargetType = 'collection' | 'raw_requirement' | 'project';

export interface AttachmentResponse {
  id: string;
  fileDataId: string;
  targetType: AttachmentTargetType;
  targetId: string;
  displayName: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadAttachmentDto {
  file: File;
  targetType: AttachmentTargetType;
  targetId?: string;
  displayName?: string;
}

export interface AttachmentListResponse {
  data: AttachmentResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export const attachmentApi = {
  upload: async (dto: UploadAttachmentDto): Promise<AttachmentResponse> => {
    const formData = new FormData();
    formData.append('file', dto.file);
    formData.append('targetType', dto.targetType);
    if (dto.targetId) {
      formData.append('targetId', dto.targetId);
    }
    if (dto.displayName) {
      formData.append('displayName', dto.displayName);
    }

    const response = await api.post<{ code: number; data: AttachmentResponse }>(
      '/attachments/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data as AttachmentResponse;
  },

  getList: async (params: {
    targetType: string;
    targetId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AttachmentListResponse> => {
    const response = await api.get<{ code: number; data: AttachmentListResponse }>(
      '/attachments',
      { params }
    );
    return response.data as AttachmentListResponse;
  },

  getById: async (id: string): Promise<AttachmentResponse> => {
    const response = await api.get<{ code: number; data: AttachmentResponse }>(
      `/attachments/${id}`
    );
    return response.data as AttachmentResponse;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/attachments/${id}`);
  },

  batchGet: async (ids: string[]): Promise<AttachmentResponse[]> => {
    const response = await api.post<{ code: number; data: AttachmentResponse[] }>(
      '/attachments/batch',
      { ids }
    );
    return response.data as AttachmentResponse[];
  },

  download: async (id: string): Promise<Blob> => {
    const response = await api.get(`/attachments/${id}/download`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  },
};
