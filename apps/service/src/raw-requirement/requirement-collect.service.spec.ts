import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { RequirementCollectService } from './requirement-collect.service';
import { RawRequirementService } from './raw-requirement.service';
import { AIChatClientService } from '../ai/ai-chat-client.service';
import { FileConversionClientService } from '../common/services/file-conversion-client.service';
import { ProjectAttachmentService } from '../project-attachment/project-attachment.service';
import { CollectRequirementDto } from '@req2task/dto';

describe('RequirementCollectService', () => {
  let service: RequirementCollectService;
  let mockRawRequirementService: Partial<RawRequirementService>;
  let mockAIChatClient: Partial<AIChatClientService>;
  let mockFileConversionClient: Partial<FileConversionClientService>;
  let mockProjectAttachmentService: Partial<ProjectAttachmentService>;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    mockRawRequirementService = {
      getRawRequirementById: jest.fn(),
    };

    mockAIChatClient = {
      getOrCreateConversation: jest.fn(),
      getStreamUrl: jest.fn(),
    };

    mockFileConversionClient = {
      transcribeAudio: jest.fn(),
    };

    mockProjectAttachmentService = {
      findById: jest.fn(),
    };

    mockResponse = {
      setHeader: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      pipe: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequirementCollectService,
        { provide: RawRequirementService, useValue: mockRawRequirementService },
        { provide: AIChatClientService, useValue: mockAIChatClient },
        { provide: FileConversionClientService, useValue: mockFileConversionClient },
        { provide: ProjectAttachmentService, useValue: mockProjectAttachmentService },
      ],
    }).compile();

    service = module.get<RequirementCollectService>(RequirementCollectService);
  });

  describe('collect', () => {
    it('should send error when raw requirement not found', async () => {
      (mockRawRequirementService.getRawRequirementById as jest.Mock).mockResolvedValue(null);

      const dto: CollectRequirementDto = { content: 'Test content' };
      await service.collect('invalid-id', dto, mockResponse as Response);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Accel-Buffering', 'no');
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"type":"error"'),
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should collect with text content only', async () => {
      const mockRawRequirement = { id: '123', originalContent: 'Test' };
      const mockConversation = { id: 'conv-1' };
      const streamUrl = 'http://localhost:4001/api/ai/conversations/conv-1/messages/stream';

      (mockRawRequirementService.getRawRequirementById as jest.Mock).mockResolvedValue(mockRawRequirement);
      (mockAIChatClient.getOrCreateConversation as jest.Mock).mockResolvedValue(mockConversation);
      (mockAIChatClient.getStreamUrl as jest.Mock).mockReturnValue(streamUrl);

      const dto: CollectRequirementDto = { content: 'User requirement text' };
      await service.collect('123', dto, mockResponse as Response);

      expect(mockRawRequirementService.getRawRequirementById).toHaveBeenCalledWith('123');
      expect(mockAIChatClient.getOrCreateConversation).toHaveBeenCalledWith({
        rawRequirementId: '123',
        title: 'Collect for requirement 123',
        systemPrompt: expect.any(String),
      });
      expect(mockAIChatClient.getStreamUrl).toHaveBeenCalledWith('conv-1', {
        content: 'User requirement text',
        configId: undefined,
      });
    });

    it('should collect with audio transcription', async () => {
      const mockRawRequirement = { id: '123', originalContent: 'Test' };
      const mockConversation = { id: 'conv-1' };
      const streamUrl = 'http://localhost:4001/api/ai/conversations/conv-1/messages/stream';

      (mockRawRequirementService.getRawRequirementById as jest.Mock).mockResolvedValue(mockRawRequirement);
      (mockAIChatClient.getOrCreateConversation as jest.Mock).mockResolvedValue(mockConversation);
      (mockAIChatClient.getStreamUrl as jest.Mock).mockReturnValue(streamUrl);
      (mockFileConversionClient.transcribeAudio as jest.Mock).mockResolvedValue({
        success: true,
        text: 'Transcribed audio content',
      });

      const dto: CollectRequirementDto = {
        content: 'Additional text',
        audioFile: {
          type: 'base64',
          data: 'audio-data',
          mimeType: 'audio/mp3',
        },
      };
      await service.collect('123', dto, mockResponse as Response);

      expect(mockFileConversionClient.transcribeAudio).toHaveBeenCalledWith({
        type: 'base64',
        data: 'audio-data',
        mimeType: 'audio/mp3',
      });
      expect(mockAIChatClient.getStreamUrl).toHaveBeenCalledWith('conv-1', {
        content: expect.stringContaining('Transcribed audio content'),
        configId: undefined,
      });
    });

    it('should send error when no content provided', async () => {
      const mockRawRequirement = { id: '123', originalContent: 'Test' };
      (mockRawRequirementService.getRawRequirementById as jest.Mock).mockResolvedValue(mockRawRequirement);

      const dto: CollectRequirementDto = {};
      await service.collect('123', dto, mockResponse as Response);

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('No content provided'),
      );
    });

    it('should handle attachment validation', async () => {
      const mockRawRequirement = { id: '123', originalContent: 'Test' };
      const mockConversation = { id: 'conv-1' };
      const streamUrl = 'http://localhost:4001/api/ai/conversations/conv-1/messages/stream';

      (mockRawRequirementService.getRawRequirementById as jest.Mock).mockResolvedValue(mockRawRequirement);
      (mockAIChatClient.getOrCreateConversation as jest.Mock).mockResolvedValue(mockConversation);
      (mockAIChatClient.getStreamUrl as jest.Mock).mockReturnValue(streamUrl);
      (mockProjectAttachmentService.findById as jest.Mock).mockResolvedValue({ id: 'att-1' });

      const dto: CollectRequirementDto = {
        content: 'Test',
        attachmentIds: ['att-1', 'att-2'],
        projectId: 'proj-1',
      };
      await service.collect('123', dto, mockResponse as Response);

      expect(mockProjectAttachmentService.findById).toHaveBeenCalledWith('att-1');
      expect(mockProjectAttachmentService.findById).toHaveBeenCalledWith('att-2');
    });

    it('should handle audio transcription failure gracefully', async () => {
      const mockRawRequirement = { id: '123', originalContent: 'Test' };
      const mockConversation = { id: 'conv-1' };
      const streamUrl = 'http://localhost:4001/api/ai/conversations/conv-1/messages/stream';

      (mockRawRequirementService.getRawRequirementById as jest.Mock).mockResolvedValue(mockRawRequirement);
      (mockAIChatClient.getOrCreateConversation as jest.Mock).mockResolvedValue(mockConversation);
      (mockAIChatClient.getStreamUrl as jest.Mock).mockReturnValue(streamUrl);
      (mockFileConversionClient.transcribeAudio as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Transcription failed',
      });

      const dto: CollectRequirementDto = {
        audioFile: {
          type: 'base64',
          data: 'audio-data',
          mimeType: 'audio/mp3',
        },
      };
      await service.collect('123', dto, mockResponse as Response);

      expect(mockAIChatClient.getStreamUrl).toHaveBeenCalledWith('conv-1', {
        content: expect.not.stringContaining('[语音转写]'),
        configId: undefined,
      });
    });
  });
});
