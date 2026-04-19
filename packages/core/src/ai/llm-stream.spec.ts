import axios from 'axios';
import { Readable } from 'stream';
import { OpenAIProvider } from './openai.provider';
import { DeepSeekProvider } from './deepseek.provider';
import { LLMConfig } from '../entities/llm-config.entity';
import { LLMProviderType } from '@req2task/dto';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LLM Stream Support', () => {
  const createMockConfig = (provider: LLMProviderType): LLMConfig => ({
    id: 'config-1',
    name: 'Test Config',
    provider,
    apiKey: 'test-api-key',
    baseUrl: null,
    modelName: 'test-model',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    isActive: true,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as LLMConfig);

  const createMockStreamResponse = (chunks: string[]) => {
    const mockStream = new Readable({
      read() {},
    });

    chunks.forEach((content) => {
      const sseData = JSON.stringify({
        choices: [{ delta: { content } }],
      });
      mockStream.push(`data: ${sseData}\n`);
    });
    mockStream.push('data: [DONE]\n');
    mockStream.push(null);

    return mockStream;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue({
      post: jest.fn(),
      defaults: {},
    } as unknown as ReturnType<typeof mockedAxios.create>);
  });

  describe('OpenAIProvider generateStream', () => {
    it('should parse SSE chunks correctly', async () => {
      const config = createMockConfig(LLMProviderType.OPENAI);
      const provider = new OpenAIProvider(config);

      const mockStreamData = createMockStreamResponse(['Hello', ' ', 'World']);
      const mockPost = mockedAxios.create().post as jest.Mock;
      mockPost.mockResolvedValue({ data: mockStreamData });

      const generator = await provider.generateStream([
        { role: 'user', content: 'test' },
      ]);

      const chunks: string[] = [];
      for await (const chunk of generator) {
        if (!chunk.done) {
          chunks.push(chunk.content);
        }
      }

      expect(chunks.join('')).toBe('Hello World');
    });

    it('should handle empty response', async () => {
      const config = createMockConfig(LLMProviderType.OPENAI);
      const provider = new OpenAIProvider(config);

      const mockStream = new Readable({
        read() {},
      });
      mockStream.push('data: [DONE]\n');
      mockStream.push(null);

      const mockPost = mockedAxios.create().post as jest.Mock;
      mockPost.mockResolvedValue({ data: mockStream });

      const generator = await provider.generateStream([
        { role: 'user', content: 'test' },
      ]);

      let doneCount = 0;
      for await (const chunk of generator) {
        if (chunk.done) doneCount++;
      }

      expect(doneCount).toBe(1);
    });

    it('should set stream option to true in request', async () => {
      const config = createMockConfig(LLMProviderType.OPENAI);
      const provider = new OpenAIProvider(config);

      const mockStream = createMockStreamResponse(['test']);
      const mockPost = mockedAxios.create().post as jest.Mock;
      mockPost.mockResolvedValue({ data: mockStream });

      await provider.generateStream([
        { role: 'user', content: 'test' },
      ]);

      expect(mockPost).toHaveBeenCalledWith(
        '/chat/completions',
        expect.objectContaining({ stream: true }),
        expect.objectContaining({ responseType: 'stream' }),
      );
    });
  });

  describe('DeepSeekProvider generateStream', () => {
    it('should parse SSE chunks correctly', async () => {
      const config = createMockConfig(LLMProviderType.DEEPSEEK);
      const provider = new DeepSeekProvider(config);

      const mockStreamData = createMockStreamResponse(['Deep', ' Seek', ' AI']);
      const mockPost = mockedAxios.create().post as jest.Mock;
      mockPost.mockResolvedValue({ data: mockStreamData });

      const generator = await provider.generateStream([
        { role: 'user', content: 'test' },
      ]);

      const chunks: string[] = [];
      for await (const chunk of generator) {
        if (!chunk.done) {
          chunks.push(chunk.content);
        }
      }

      expect(chunks.join('')).toBe('Deep Seek AI');
    });

    it('should use correct base URL', () => {
      const config = createMockConfig(LLMProviderType.DEEPSEEK);
      new DeepSeekProvider(config);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.deepseek.com',
        }),
      );
    });
  });
});
