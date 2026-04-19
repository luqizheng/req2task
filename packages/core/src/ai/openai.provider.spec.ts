import { OpenAIProvider } from './openai.provider';
import { DeepSeekProvider } from './deepseek.provider';
import { LLMConfig } from '../entities/llm-config.entity';
import { LLMProviderType } from '@req2task/dto';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LLM Providers', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue({
      post: jest.fn(),
      get: jest.fn(),
      defaults: {},
    } as unknown as ReturnType<typeof mockedAxios.create>);
  });

  describe('OpenAIProvider', () => {
    it('should have correct provider type', () => {
      const config = createMockConfig(LLMProviderType.OPENAI);
      const provider = new OpenAIProvider(config);

      expect(provider.providerType).toBe(LLMProviderType.OPENAI);
    });

    it('should use default OpenAI base URL when no baseUrl provided', () => {
      const config = createMockConfig(LLMProviderType.OPENAI);
      new OpenAIProvider(config);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.openai.com/v1',
        }),
      );
    });

    it('should use custom base URL when provided', () => {
      const config = { ...createMockConfig(LLMProviderType.OPENAI), baseUrl: 'https://custom.api.com/v1' } as LLMConfig;
      new OpenAIProvider(config);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://custom.api.com/v1',
        }),
      );
    });

    it('should generate response with correct message structure', async () => {
      const config = createMockConfig(LLMProviderType.OPENAI);
      const provider = new OpenAIProvider(config);
      const mockClient = mockedAxios.create().post as jest.Mock;
      
      mockClient.mockResolvedValue({
        data: {
          choices: [{ message: { content: 'Test response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        },
      });

      const response = await provider.generate([
        { role: 'user', content: 'Hello' },
      ]);

      expect(response.content).toBe('Test response');
      expect(response.usage).toEqual({
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      });
    });

    it('should handle empty response content', async () => {
      const config = createMockConfig(LLMProviderType.OPENAI);
      const provider = new OpenAIProvider(config);
      const mockClient = mockedAxios.create().post as jest.Mock;

      mockClient.mockResolvedValue({
        data: {
          choices: [{ message: { content: '' } }],
        },
      });

      const response = await provider.generate([{ role: 'user', content: 'Hello' }]);

      expect(response.content).toBe('');
    });

    it('should merge custom options with config defaults', async () => {
      const config = createMockConfig(LLMProviderType.OPENAI);
      const provider = new OpenAIProvider(config);
      const mockClient = mockedAxios.create().post as jest.Mock;

      mockClient.mockResolvedValue({
        data: {
          choices: [{ message: { content: 'Response' } }],
        },
      });

      await provider.generate(
        [{ role: 'user', content: 'Hello' }],
        { temperature: 0.5, maxTokens: 100 },
      );

      expect(mockClient).toHaveBeenCalledWith(
        '/chat/completions',
        expect.objectContaining({
          temperature: 0.5,
          max_tokens: 100,
          model: 'test-model',
        }),
      );
    });
  });

  describe('DeepSeekProvider', () => {
    it('should have correct provider type', () => {
      const config = createMockConfig(LLMProviderType.DEEPSEEK);
      const provider = new DeepSeekProvider(config);

      expect(provider.providerType).toBe(LLMProviderType.DEEPSEEK);
    });

    it('should use default DeepSeek base URL when no baseUrl provided', () => {
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
