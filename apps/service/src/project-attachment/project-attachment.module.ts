import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileData, ProjectAttachment } from '@req2task/core';
import { ProjectAttachmentService } from './project-attachment.service';
import { ProjectAttachmentController } from './project-attachment.controller';
import { StorageService } from '../common/services/storage.service';
import { FileDataModule } from '../file-data/file-data.module';

@Module({
  imports: [TypeOrmModule.forFeature([FileData, ProjectAttachment]), FileDataModule],
  controllers: [ProjectAttachmentController],
  providers: [ProjectAttachmentService, StorageService],
  exports: [ProjectAttachmentService],
})
export class ProjectAttachmentModule {}
