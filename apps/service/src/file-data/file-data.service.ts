import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileData, FileStatus } from '@req2task/core';
import { StorageService } from '../common/services/storage.service';

@Injectable()
export class FileDataService {
  private readonly logger = new Logger(FileDataService.name);

  constructor(
    @InjectRepository(FileData)
    private readonly fileDataRepository: Repository<FileData>,
    private readonly storageService: StorageService,
  ) {}

  async uploadFile(fileBuffer: Buffer, originalName: string, mimeType: string, userId: string): Promise<FileData> {
    // 计算MD5哈希值
    const crypto = await import('crypto');
    const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    // 检查是否已存在相同文件
    let fileData = await this.fileDataRepository.findOne({
      where: { fileHash },
    });

    if (!fileData) {
      // 上传文件到存储服务
      const storagePath = await this.storageService.upload(
        fileBuffer,
        originalName,
        mimeType,
      );

      // 创建新的文件数据记录，状态为待删除
      fileData = this.fileDataRepository.create({
        fileHash,
        originalName,
        mimeType,
        size: fileBuffer.length,
        storagePath,
        status: FileStatus.PENDING_DELETE,
        createdById: userId,
      });

      fileData = await this.fileDataRepository.save(fileData);
      this.logger.log(`File uploaded: ${fileData.id} (${originalName}) by user ${userId}`);
    } else {
      this.logger.log(`File already exists: ${fileData.id} (${originalName})`);
    }

    return fileData;
  }

  async updateFileStatus(fileDataId: string, status: FileStatus): Promise<FileData> {
    const fileData = await this.fileDataRepository.findOneBy({ id: fileDataId });
    if (!fileData) {
      throw new Error('FileData not found');
    }

    fileData.status = status;
    const updatedFileData = await this.fileDataRepository.save(fileData);
    this.logger.log(`File status updated: ${fileDataId} -> ${status}`);
    return updatedFileData;
  }

  async findById(id: string): Promise<FileData | null> {
    return this.fileDataRepository.findOneBy({ id });
  }
}