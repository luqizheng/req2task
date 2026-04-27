import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { FileData, FileStatus } from '@req2task/core';
import { StorageService } from '../common/services/storage.service';

@Injectable()
export class FileDataCleanupService {
  private readonly logger = new Logger(FileDataCleanupService.name);

  constructor(
    @InjectRepository(FileData)
    private readonly fileDataRepository: Repository<FileData>,
    private readonly storageService: StorageService,
  ) {}

  // 每天凌晨12点执行清理任务
  @Cron('0 0 0 * * *')
  async cleanupExpiredFiles() {
    this.logger.log('Starting file cleanup job...');

    try {
      // 计算24小时前的时间
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // 查找所有状态为待删除且创建时间超过24小时的文件
      const expiredFiles = await this.fileDataRepository.find({
        where: {
          status: FileStatus.PENDING_DELETE,
          createdAt: LessThan(twentyFourHoursAgo),
        },
      });

      this.logger.log(`Found ${expiredFiles.length} expired files to delete`);

      // 批量删除文件
      for (const file of expiredFiles) {
        try {
          // 从存储服务中删除文件
          await this.storageService.delete(file.storagePath);
          
          // 从数据库中删除文件记录
          await this.fileDataRepository.delete(file.id);
          
          this.logger.log(`Deleted expired file: ${file.id} (${file.originalName})`);
        } catch (error) {
          this.logger.error(`Failed to delete file ${file.id}: ${error.message}`);
        }
      }

      this.logger.log('File cleanup job completed successfully');
    } catch (error) {
      this.logger.error(`File cleanup job failed: ${error.message}`);
    }
  }
}