import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileData, ProjectAttachment } from '@req2task/core';
import { FileDataController } from './file-data.controller';
import { FileDataService } from './file-data.service';
import { FileDataCleanupService } from './file-data-cleanup.service';
import { StorageService } from '../common/services/storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([FileData, ProjectAttachment])],
  controllers: [FileDataController],
  providers: [FileDataService, FileDataCleanupService, StorageService],
  exports: [FileDataService],
})
export class FileDataModule {}
