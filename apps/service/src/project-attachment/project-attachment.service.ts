import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileData, ProjectAttachment, FileStatus } from '@req2task/core';
import {
  AttachmentResponseDto,
  AttachmentQueryDto,
  BatchGetAttachmentsDto,
  CreateAttachmentByFileDataIdDto,
} from '@req2task/dto';
import { StorageService } from '../common/services/storage.service';
import { Readable } from 'stream';
import { FileDataService } from '../file-data/file-data.service';

@Injectable()
export class ProjectAttachmentService {
  private readonly logger = new Logger(ProjectAttachmentService.name);

  constructor(
    @InjectRepository(FileData)
    private readonly fileDataRepository: Repository<FileData>,
    @InjectRepository(ProjectAttachment)
    private readonly attachmentRepository: Repository<ProjectAttachment>,
    private readonly storageService: StorageService,
    private readonly fileDataService: FileDataService,
  ) {}



  async createByFileDataId(
    dto: CreateAttachmentByFileDataIdDto,
    userId: string,
  ): Promise<AttachmentResponseDto> {
    // 查找已经上传的文件数据
    const fileData = await this.fileDataService.findById(dto.fileDataId);
    if (!fileData) {
      throw new NotFoundException('File data not found');
    }

    // 将文件状态从待删除更新为正常
    await this.fileDataService.updateFileStatus(fileData.id, FileStatus.NORMAL);

    // 创建附件关联
    const attachment = this.attachmentRepository.create({
      fileDataId: fileData.id,
      targetType: dto.targetType,
      targetId: dto.targetId,
      displayName: dto.displayName || fileData.originalName,
      description: dto.description || null,
      createdById: userId,
    });
    await this.attachmentRepository.save(attachment);

    return this.toResponseDto(attachment, fileData);
  }

  async findById(id: string): Promise<AttachmentResponseDto> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
      relations: ['fileData', 'createdBy'],
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    return this.toResponseDto(attachment, attachment.fileData);
  }

  async findByTarget(query: AttachmentQueryDto): Promise<{
    data: AttachmentResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { targetType, targetId, page = 1, pageSize = 20 } = query;
    const skip = (page - 1) * pageSize;

    const qb = this.attachmentRepository
      .createQueryBuilder('attachment')
      .leftJoinAndSelect('attachment.fileData', 'fileData');

    if (targetType) {
      qb.andWhere('attachment.targetType = :targetType', { targetType });
    }
    if (targetId) {
      qb.andWhere('attachment.targetId = :targetId', { targetId });
    }

    const [attachments, total] = await qb
      .orderBy('attachment.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      data: attachments.map((a) => this.toResponseDto(a, a.fileData)),
      total,
      page,
      pageSize,
    };
  }

  async batchGet(dto: BatchGetAttachmentsDto): Promise<AttachmentResponseDto[]> {
    const attachments = await this.attachmentRepository
      .createQueryBuilder('attachment')
      .leftJoinAndSelect('attachment.fileData', 'fileData')
      .whereInIds(dto.ids)
      .getMany();

    return attachments.map((a) => this.toResponseDto(a, a.fileData));
  }

  async delete(id: string): Promise<void> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
      relations: ['fileData'],
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    await this.attachmentRepository.delete(id);

    const remainingAttachments = await this.attachmentRepository.count({
      where: { fileDataId: attachment.fileDataId },
    });

    if (remainingAttachments === 0) {
      await this.storageService.delete(attachment.fileData.storagePath);
      await this.fileDataRepository.delete(attachment.fileDataId);
    }
  }

  async download(id: string): Promise<{
    stream: Readable;
    fileData: FileData;
    attachment: ProjectAttachment;
  }> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
      relations: ['fileData'],
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const stream = await this.storageService.download(attachment.fileData.storagePath);
    return {
      stream,
      fileData: attachment.fileData,
      attachment,
    };
  }

  private toResponseDto(
    attachment: ProjectAttachment,
    fileData: FileData,
  ): AttachmentResponseDto {
    return {
      id: attachment.id,
      fileDataId: fileData.id,
      targetType: attachment.targetType,
      targetId: attachment.targetId,
      displayName: attachment.displayName,
      description: attachment.description,
      originalName: fileData.originalName,
      mimeType: fileData.mimeType,
      size: Number(fileData.size),
      storagePath: fileData.storagePath,
      createdById: attachment.createdById,
      createdAt: attachment.createdAt,
      updatedAt: attachment.updatedAt,
    };
  }
}
