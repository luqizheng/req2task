import api from './axios';

export interface FileDataResponse {
  id: string;
  fileHash: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  status: 'normal' | 'pending_delete';
  createdById: string | null;
  createdAt: string;
}

export interface UploadFileDto {
  file: File;
}

export const fileDataApi = {
  upload: async (dto: UploadFileDto): Promise<{ fileDataId: string }> => {
    const formData = new FormData();
    formData.append('file', dto.file);

    const response = await api.post<{ fileDataId: string }>(
      '/file-data/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response;
  },

  getBatch: async (ids: string[]): Promise<{ fileDataList: FileDataResponse[] }> => {
    const response = await api.get<{ fileDataList: FileDataResponse[] }>(
      `/file-data/batch?ids=${ids.join(',')}`
    );
    return response;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/file-data/${id}`);
  },
};
