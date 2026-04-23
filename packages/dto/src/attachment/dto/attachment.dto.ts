import { AttachmentTargetType } from '../../enums/attachment-target-type.enum';
export { AttachmentTargetType };

export class UploadAttachmentDto {
  targetType!: AttachmentTargetType;
  targetId!: string;
  displayName?: string;
  description?: string;
}

export class AttachmentResponseDto {
  id!: string;
  fileDataId!: string;
  targetType!: AttachmentTargetType;
  targetId!: string;
  displayName!: string;
  description!: string | null;
  originalName!: string;
  mimeType!: string;
  size!: number;
  storagePath!: string;
  createdById!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export class AttachmentQueryDto {
  targetType?: AttachmentTargetType;
  targetId?: string;
  page: number = 1;
  pageSize: number = 20;
}

export class BatchGetAttachmentsDto {
  ids!: string[];
}
