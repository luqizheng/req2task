import type { LLMMessage, LLMOptions, LLMProvider, StreamChunk, LLMResponse } from './types.js';
import { LLMProviderType } from '@req2task/dto';

const MOCK_RESPONSES = [
  '这是一个模拟的AI响应。由于当前没有配置LLM供应商，服务运行在模拟模式下。',
  '【模拟模式】您好！当前服务使用虚拟LLM Provider，所有响应均为模拟输出。',
  '【提示】请在主服务中配置有效的LLM供应商（如OpenAI、DeepSeek或Ollama）以获得真实的AI响应。',
];

export class MockProvider implements LLMProvider {
  readonly providerType = LLMProviderType.OPENAI;
  readonly displayName = 'Mock Provider (Virtual)';

  private responseIndex = 0;

  async generate(messages: LLMMessage[], _options?: LLMOptions): Promise<LLMResponse> {
    const content = this.generateResponse(messages);
    return {
      content,
      usage: {
        promptTokens: this.countTokens(messages),
        completionTokens: this.countTokens(content),
        totalTokens: this.countTokens(messages) + this.countTokens(content),
      },
      finishReason: 'stop',
    };
  }

  async generateStream(messages: LLMMessage[], _options?: LLMOptions): Promise<AsyncGenerator<StreamChunk>> {
    const content = this.generateResponse(messages);
    const chunks = this.splitIntoChunks(content);

    chunks.push({ content: '', done: true });

    const chunkArray = chunks;
    let index = 0;
    return (async function* (): AsyncGenerator<StreamChunk> {
      while (index < chunkArray.length) yield chunkArray[index++];
    })();
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  private generateResponse(messages: LLMMessage[]): string {
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage?.content || '';

    const response = MOCK_RESPONSES[this.responseIndex % MOCK_RESPONSES.length];
    this.responseIndex++;

    if (userContent.length > 0) {
      return `${response}\n\n[收到消息: ${userContent.slice(0, 50)}${userContent.length > 50 ? '...' : ''}]`;
    }

    return response;
  }

  private splitIntoChunks(text: string): StreamChunk[] {
    const chunkSize = 5;
    const chunks: StreamChunk[] = [];

    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push({
        content: text.slice(i, i + chunkSize),
        done: false,
      });
    }

    return chunks;
  }

  private countTokens(text: string | LLMMessage[]): number {
    if (Array.isArray(text)) {
      return Math.ceil(JSON.stringify(text).length / 4);
    }
    return Math.ceil(text.length / 4);
  }
}
