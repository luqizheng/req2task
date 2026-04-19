import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { FileData, ProjectAttachment } from '@req2task/core';
import {
  UploadAttachmentDto,
  AttachmentResponseDto,
  AttachmentQueryDto,
  BatchGetAttachmentsDto,
} from '@req2task/dto';
import { StorageService } from '../common/services/storage.service';
import { Readable } from 'stream';

@Injectable()
export class ProjectAttachmentService {
  private readonly logger = new Logger(ProjectAttachmentService.name);

  constructor(
    @InjectRepository(FileData)
    private readonly fileDataRepository: Repository<FileData>,
    @InjectRepository(ProjectAttachment)
    private readonly attachmentRepository: Repository<ProjectAttachment>,
    private readonly storageService: StorageService,
  ) {}

  async upload(
    dto: UploadAttachmentDto,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    userId: string,
  ): Promise<AttachmentResponseDto> {
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    let fileData = await this.fileDataRepository.findOne({
      where: { fileHash },
    });

    if (!fileData) {
      const storagePath = await this.storageService.upload(
        fileBuffer,
        fileName,
        mimeType,
      );

      fileData = this.fileDataRepository.create({
        fileHash,
        originalName: fileName,
        mimeType,
        size: fileBuffer.length,
        storagePath,
      });
      fileData = await this.fileDataRepository.save(fileData);
    }

    const attachment = this.attachmentRepository.create({
      fileDataId: fileData.id,
      targetType: dto.targetType,
      targetId: dto.targetId,
      displayName: dto.displayName || fileName,
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
