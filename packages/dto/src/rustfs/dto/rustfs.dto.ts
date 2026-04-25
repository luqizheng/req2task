import { AttachmentTargetType } from '../../enums/attachment-target-type.enum';

/**
 * @public
 */
export class PresignPutRequestDto {
  fileName!: string;
  contentType!: string;
}

/**
 * @public
 */
export class PresignPutResponseDto {
  presignedUrl!: string;
  fileDataId!: string;
  expiresIn!: number;
}

/**
 * @public
 */
export class PresignGetResponseDto {
  presignedUrl!: string;
  expiresIn!: number;
}

/**
 * @public
 */
export class CreateAttachmentByFileDataIdDto {
  fileDataId!: string;
  targetType!: AttachmentTargetType;
  targetId?: string;
  displayName?: string;
  description?: string;
  fileName!: string;
  contentType!: string;
  size!: number;
}
