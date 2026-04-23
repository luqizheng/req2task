import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectAttachmentService } from './project-attachment.service';
import { StorageService } from '../common/services/storage.service';
import { FileData, ProjectAttachment } from '@req2task/core';
import { NotFoundException } from '@nestjs/common';

describe('ProjectAttachmentService', () => {
  let service: ProjectAttachmentService;
  let fileDataRepository: jest.Mocked<Repository<FileData>>;
  let attachmentRepository: jest.Mocked<Repository<ProjectAttachment>>;
  let storageService: jest.Mocked<StorageService>;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockFileDataId = '223e4567-e89b-12d3-a456-426614174001';
  const mockAttachmentId = '323e4567-e89b-12d3-a456-426614174002';

  const mockFileData: Partial<FileData> = {
    id: mockFileDataId,
    fileHash: 'abc123hash',
    originalName: 'test.txt',
    mimeType: 'text/plain',
    size: 100,
    storagePath: 'attachments/2024/01/01/test.txt',
    createdAt: new Date(),
  };

  const mockAttachment: Partial<ProjectAttachment> = {
    id: mockAttachmentId,
    fileDataId: mockFileDataId,
    targetType: 'project' as any,
    targetId: '423e4567-e89b-12d3-a456-426614174003',
    displayName: 'test.txt',
    description: null,
    createdById: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    fileData: mockFileData as FileData,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectAttachmentService,
        {
          provide: getRepositoryToken(FileData),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProjectAttachment),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            upload: jest.fn(),
            delete: jest.fn(),
            download: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectAttachmentService>(ProjectAttachmentService);
    fileDataRepository = module.get(getRepositoryToken(FileData));
    attachmentRepository = module.get(getRepositoryToken(ProjectAttachment));
    storageService = module.get(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('should create new file data for new file', async () => {
      const dto = {
        targetType: 'project' as any,
        targetId: '423e4567-e89b-12d3-a456-426614174003',
        displayName: 'test.txt',
        file: {
          buffer: Buffer.from('test content'),
          originalname: 'test.txt',
          mimetype: 'text/plain',
        },
      };

      fileDataRepository.findOne.mockResolvedValue(null);
      fileDataRepository.create.mockReturnValue(mockFileData as FileData);
      fileDataRepository.save.mockResolvedValue(mockFileData as FileData);
      attachmentRepository.create.mockReturnValue(mockAttachment as ProjectAttachment);
      attachmentRepository.save.mockResolvedValue(mockAttachment as ProjectAttachment);
      storageService.upload.mockResolvedValue('attachments/2024/01/01/test.txt');

      const result = await service.upload(dto, dto.file.buffer, dto.file.originalname, dto.file.mimetype, mockUserId);

      expect(result).toBeDefined();
      expect(result.fileDataId).toBe(mockFileDataId);
      expect(storageService.upload).toHaveBeenCalled();
    });

    it('should reuse existing file data for duplicate file', async () => {
      const dto = {
        targetType: 'project' as any,
        targetId: '423e4567-e89b-12d3-a456-426614174003',
        displayName: 'test.txt',
        file: {
          buffer: Buffer.from('test content'),
          originalname: 'test.txt',
          mimetype: 'text/plain',
        },
      };

      fileDataRepository.findOne.mockResolvedValue(mockFileData as FileData);
      attachmentRepository.create.mockReturnValue(mockAttachment as ProjectAttachment);
      attachmentRepository.save.mockResolvedValue(mockAttachment as ProjectAttachment);

      await service.upload(dto, dto.file.buffer, dto.file.originalname, dto.file.mimetype, mockUserId);

      expect(storageService.upload).not.toHaveBeenCalled();
      expect(fileDataRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return attachment when found', async () => {
      attachmentRepository.findOne.mockResolvedValue(mockAttachment as ProjectAttachment);

      const result = await service.findById(mockAttachmentId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockAttachmentId);
    });

    it('should throw NotFoundException when not found', async () => {
      attachmentRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete attachment and file data when no references remain', async () => {
      attachmentRepository.findOne.mockResolvedValue(mockAttachment as ProjectAttachment);
      attachmentRepository.delete.mockResolvedValue({ affected: 1, raw: [] });
      attachmentRepository.count.mockResolvedValue(0);
      fileDataRepository.delete.mockResolvedValue({ affected: 1, raw: [] });
      storageService.delete.mockResolvedValue(undefined);

      await service.delete(mockAttachmentId);

      expect(storageService.delete).toHaveBeenCalledWith(mockFileData.storagePath);
      expect(fileDataRepository.delete).toHaveBeenCalledWith(mockFileDataId);
    });

    it('should not delete file data when other references exist', async () => {
      attachmentRepository.findOne.mockResolvedValue(mockAttachment as ProjectAttachment);
      attachmentRepository.delete.mockResolvedValue({ affected: 1, raw: [] });
      attachmentRepository.count.mockResolvedValue(1);

      await service.delete(mockAttachmentId);

      expect(storageService.delete).not.toHaveBeenCalled();
      expect(fileDataRepository.delete).not.toHaveBeenCalled();
    });
  });
});
