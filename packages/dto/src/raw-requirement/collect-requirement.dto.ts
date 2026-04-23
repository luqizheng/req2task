export interface AudioFileDto {
  type: 'base64' | 'id';
  data: string;
  mimeType?: string;
}

export class CollectRequirementDto {
  content?: string;
  audioFile?: AudioFileDto;
  attachmentIds?: string[];
  projectId?: string;
  configId?: string;
}
