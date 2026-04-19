import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileData, ProjectAttachment } from '@req2task/core';
import { ProjectAttachmentService } from './project-attachment.service';
import { ProjectAttachmentController } from './project-attachment.controller';
import { StorageService } from '../common/services/storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([FileData, ProjectAttachment])],
  controllers: [ProjectAttachmentController],
  providers: [ProjectAttachmentService, StorageService],
  exports: [ProjectAttachmentService],
})
export class ProjectAttachmentModule {}
