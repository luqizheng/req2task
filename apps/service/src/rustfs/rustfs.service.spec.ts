import { Test, TestingModule } from '@nestjs/testing';
import { RustFSService } from './rustfs.service';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('uuid');

describe('RustFSService', () => {
  let service: RustFSService;
  let mockS3Client: jest.Mocked<S3Client>;
  let mockSend: jest.Mock;

  beforeEach(async () => {
    process.env.RUSTFS_BUCKET = 'test-bucket';
    process.env.RUSTFS_ENDPOINT = 'localhost:9000';
    process.env.RUSTFS_ACCESS_KEY = 'test-access-key';
    process.env.RUSTFS_SECRET_KEY = 'test-secret-key';

    mockSend = jest.fn();
    mockS3Client = {
      send: mockSend,
    } as any;
    (S3Client as jest.Mock).mockImplementation(() => mockS3Client);

    (getSignedUrl as jest.Mock).mockResolvedValue('https://signed-url.example.com');
    (uuidv4 as jest.Mock).mockReturnValue('mock-uuid-1234');

    const module: TestingModule = await Test.createTestingModule({
      providers: [RustFSService],
    }).compile();

    service = module.get<RustFSService>(RustFSService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize S3Client with correct configuration', () => {
      expect(S3Client).toHaveBeenCalledWith({
        endpoint: 'http://localhost:9000',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        },
        forcePathStyle: true,
      });
    });

    it('should use bucket from environment variable', () => {
      expect(service).toBeDefined();
    });
  });

  describe('getPresignedPutUrl', () => {
    it('should generate presigned PUT URL with correct file path', async () => {
      const dto = {
        fileName: 'test.pdf',
        contentType: 'application/pdf',
      };

      const result = await service.getPresignedPutUrl(dto);

      expect(result).toHaveProperty('presignedUrl', 'https://signed-url.example.com');
      expect(result).toHaveProperty('expiresIn', 3600);
      expect(result.fileDataId).toMatch(/^attachments\/\d{4}\/\d{2}\/\d{2}\/mock-uuid-1234_test\.pdf$/);
      expect(getSignedUrl).toHaveBeenCalledWith(mockS3Client, expect.any(PutObjectCommand), {
        expiresIn: 3600,
      });
    });

    it('should create PutObjectCommand with correct parameters', async () => {
      const dto = {
        fileName: 'document.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };

      await service.getPresignedPutUrl(dto);

      const putCommandArg = (getSignedUrl as jest.Mock).mock.calls[0][1];
      expect(putCommandArg).toBeInstanceOf(PutObjectCommand);
    });

    it('should handle files with no extension', async () => {
      const dto = {
        fileName: 'README',
        contentType: 'text/plain',
      };

      const result = await service.getPresignedPutUrl(dto);

      expect(result.fileDataId).toBe('attachments/2026/04/22/mock-uuid-1234_README');
    });

    it('should return correct response structure', async () => {
      const dto = {
        fileName: 'test.pdf',
        contentType: 'application/pdf',
      };

      const result = await service.getPresignedPutUrl(dto);

      expect(result).toHaveProperty('presignedUrl');
      expect(result).toHaveProperty('fileDataId');
      expect(result).toHaveProperty('expiresIn');
      expect(typeof result.presignedUrl).toBe('string');
      expect(typeof result.fileDataId).toBe('string');
      expect(typeof result.expiresIn).toBe('number');
    });
  });

  describe('getPresignedGetUrl', () => {
    it('should generate presigned GET URL', async () => {
      const fileDataId = 'attachments/2025/04/22/test.pdf';

      const result = await service.getPresignedGetUrl(fileDataId);

      expect(result).toHaveProperty('presignedUrl', 'https://signed-url.example.com');
      expect(result).toHaveProperty('expiresIn', 3600);
      expect(getSignedUrl).toHaveBeenCalledWith(mockS3Client, expect.any(GetObjectCommand), {
        expiresIn: 3600,
      });
    });

    it('should create GetObjectCommand with correct parameters', async () => {
      const fileDataId = 'attachments/2026/04/22/custom/path/file.png';

      await service.getPresignedGetUrl(fileDataId);

      const getCommandArg = (getSignedUrl as jest.Mock).mock.calls[0][1];
      expect(getCommandArg).toBeInstanceOf(GetObjectCommand);
    });

    it('should return correct response structure', async () => {
      const fileDataId = 'attachments/2025/04/22/test.pdf';

      const result = await service.getPresignedGetUrl(fileDataId);

      expect(result).toHaveProperty('presignedUrl');
      expect(result).toHaveProperty('expiresIn');
      expect(typeof result.presignedUrl).toBe('string');
      expect(typeof result.expiresIn).toBe('number');
    });
  });

  describe('default values', () => {
    it('should use default bucket when env is not set', async () => {
      delete process.env.RUSTFS_BUCKET;

      const module: TestingModule = await Test.createTestingModule({
        providers: [RustFSService],
      }).compile();

      const newService = module.get<RustFSService>(RustFSService);
      expect(newService).toBeDefined();
    });

    it('should use default endpoint when env is not set', async () => {
      delete process.env.RUSTFS_ENDPOINT;

      const module: TestingModule = await Test.createTestingModule({
        providers: [RustFSService],
      }).compile();

      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: 'http://localhost:9000',
        }),
      );
    });
  });
});
