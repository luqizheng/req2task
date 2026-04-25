import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import {
  PresignPutRequestDto,
  PresignPutResponseDto,
  PresignGetResponseDto,
} from '@req2task/dto';

@Injectable()
export class RustFSService {
  private readonly logger = new Logger(RustFSService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly defaultExpiry = 3600;

  constructor() {
    this.bucket = process.env.RUSTFS_BUCKET || 'req2task';
    this.s3Client = new S3Client({
      endpoint: `http://${process.env.RUSTFS_ENDPOINT || 'localhost:9000'}`,
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.RUSTFS_ACCESS_KEY || '',
        secretAccessKey: process.env.RUSTFS_SECRET_KEY || '',
      },
      forcePathStyle: true,
    });
  }

  async getPresignedPutUrl(dto: PresignPutRequestDto): Promise<PresignPutResponseDto> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const fileName = dto.fileName || 'unknown';
    const ext = fileName.includes('.') ? fileName.split('.').pop() : '';
    const fileDataId = `attachments/${year}/${month}/${day}/${uuidv4()}_${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileDataId,
      ContentType: dto.contentType || 'application/octet-stream',
    });

    const presignedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: this.defaultExpiry,
    });

    this.logger.log(`Generated presigned PUT URL for: ${fileDataId}`);

    return {
      presignedUrl,
      fileDataId,
      expiresIn: this.defaultExpiry,
    };
  }

  async getPresignedGetUrl(fileDataId: string): Promise<PresignGetResponseDto> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileDataId,
    });

    const presignedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: this.defaultExpiry,
    });

    this.logger.log(`Generated presigned GET URL for: ${fileDataId}`);

    return {
      presignedUrl,
      expiresIn: this.defaultExpiry,
    };
  }
}
