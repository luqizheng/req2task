import { AttachmentTargetType } from '../../enums/attachment-target-type.enum';

export class PresignPutRequestDto {
  fileName!: string;
  contentType!: string;
}

export class PresignPutResponseDto {
  presignedUrl!: string;
  fileDataId!: string;
  expiresIn!: number;
}

export class PresignGetResponseDto {
  presignedUrl!: string;
  expiresIn!: number;
}

export class CreateAttachmentByFileDataIdDto {
  fileDataId!: string;
  targetType!: AttachmentTargetType;
  targetId?: string;
  displayName?: string;
  description?: string;
}
