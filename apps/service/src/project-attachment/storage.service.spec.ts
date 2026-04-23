const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    PutObjectCommand: jest.fn().mockImplementation(function(args) { return { input: args }; }),
    GetObjectCommand: jest.fn().mockImplementation(function(args) { return { input: args }; }),
    DeleteObjectCommand: jest.fn().mockImplementation(function(args) { return { input: args }; }),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.example.com'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from '../common/services/storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('should upload file and return storage path', async () => {
      const fileBuffer = Buffer.from('test content');
      const originalName = 'test.txt';
      const mimeType = 'text/plain';

      mockSend.mockResolvedValue({});

      const result = await service.upload(fileBuffer, originalName, mimeType);

      expect(result).toMatch(/^attachments\/\d{4}\/\d{2}\/\d{2}\/.+_test\.txt$/);
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete file from storage', async () => {
      const storagePath = 'attachments/2024/01/01/test.txt';

      mockSend.mockResolvedValue({});

      await service.delete(storagePath);

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('download', () => {
    it('should return readable stream', async () => {
      const storagePath = 'attachments/2024/01/01/test.txt';
      const mockStream = { pipe: jest.fn() };

      mockSend.mockResolvedValue({
        Body: mockStream,
      });

      const result = await service.download(storagePath);

      expect(result).toBe(mockStream);
      expect(mockSend).toHaveBeenCalled();
    });
  });
});
