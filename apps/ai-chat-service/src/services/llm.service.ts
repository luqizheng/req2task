import LLM from '@themaximalist/llm.js';
import type { Message, FileAttachment, LLMConfigMetadata } from '../types.js';
import type { Options } from '@themaximalist/llm.js';

export interface LLMResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'function_call' | null;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export class LLMService {
  private defaultModel: string;

  constructor(defaultModel: string = 'gpt-4o-mini') {
    this.defaultModel = defaultModel;
  }

  async complete(
    messages: Message[],
    model?: string,
    files?: FileAttachment[]
  ): Promise<LLMResponse> {
    const processedMessages = this.processMessages(messages, files);
    const options: Options = {
      model: model || this.defaultModel,
      extended: true,
    };

    const response = await LLM(processedMessages, options);

    if (typeof response === 'string') {
      return {
        content: response,
        finishReason: null,
      };
    }

    const typedResponse = response as {
      content: string;
      finishReason?: string;
    };

    return {
      content: typedResponse.content,
      finishReason: (typedResponse.finishReason as LLMResponse['finishReason']) || null,
    };
  }

  async completeWithConfig(
    messages: Message[],
    config: LLMConfigMetadata,
    files?: FileAttachment[]
  ): Promise<LLMResponse> {
    const processedMessages = this.processMessages(messages, files);
    const options: Options = {
      model: config.modelName,
      service: config.provider,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      temperature: Number(config.temperature),
      max_tokens: Number(config.maxTokens),
      extended: true,
    };

    const response = await LLM(processedMessages, options);

    if (typeof response === 'string') {
      return {
        content: response,
        finishReason: null,
      };
    }

    const typedResponse = response as {
      content: string;
      finishReason?: string;
    };

    return {
      content: typedResponse.content,
      finishReason: (typedResponse.finishReason as LLMResponse['finishReason']) || null,
    };
  }

  async *streamComplete(
    messages: Message[],
    model?: string,
    files?: FileAttachment[]
  ): AsyncGenerator<StreamChunk> {
    const processedMessages = this.processMessages(messages, files);
    const options: Options = {
      model: model || this.defaultModel,
      stream: true,
    };

    const response = await LLM(processedMessages, options) as unknown as {
      stream: AsyncGenerator<string>;
    };

    for await (const chunk of response.stream) {
      yield {
        content: chunk,
        done: false,
      };
    }

    yield {
      content: '',
      done: true,
    };
  }

  async *streamCompleteWithConfig(
    messages: Message[],
    config: LLMConfigMetadata,
    files?: FileAttachment[]
  ): AsyncGenerator<StreamChunk> {
    const processedMessages = this.processMessages(messages, files);
    const options: Options = {
      model: config.modelName,
      service: config.provider,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      temperature: Number(config.temperature),
      max_tokens: Number(config.maxTokens),
      stream: true,
    };

    const response = await LLM(processedMessages, options) as unknown as {
      stream: AsyncGenerator<string>;
    };

    for await (const chunk of response.stream) {
      yield {
        content: chunk,
        done: false,
      };
    }

    yield {
      content: '',
      done: true,
    };
  }

  private processMessages(
    messages: Message[],
    files?: FileAttachment[]
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const baseMessages = messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    if (!files || files.length === 0) {
      return baseMessages;
    }

    const fileContents = files
      .map((file, index) => {
        const fileName = file.name || `附件${index + 1}`;
        if (file.type === 'text') {
          return `[${fileName}]\n${file.data}`;
        }
        return `[${fileName}] (${file.type} 文件)\n${file.data}`;
      })
      .join('\n\n');

    const systemMessageIndex = baseMessages.findIndex(m => m.role === 'system');
    const systemMessage = systemMessageIndex >= 0
      ? baseMessages[systemMessageIndex]
      : null;

    const otherMessages = systemMessageIndex >= 0
      ? baseMessages.filter((_, i) => i !== systemMessageIndex)
      : baseMessages;

    const enrichedSystemMessage: { role: 'system' | 'user' | 'assistant'; content: string } = systemMessage
      ? {
          ...systemMessage,
          content: `${systemMessage.content}\n\n[附加文件内容]\n${fileContents}`,
        }
      : {
          role: 'system',
          content: `[附加文件内容]\n${fileContents}`,
        };

    return [enrichedSystemMessage, ...otherMessages];
  }

  extractFollowUpQuestions(content: string): string[] {
    const patterns = [
      /(?:追问|问题|请问|能否|是否可以|请确认)[:：]\s*([^\n]+)/gi,
      /(\d+[.、](?:\s*[^\n]+))/g,
      /(?:另外|还有|除此之外)[，,]([^\n]+)/gi,
    ];

    const questions: Set<string> = new Set();

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const question = match[1]?.trim();
        if (question && question.length > 5 && question.length < 200) {
          questions.add(question);
        }
      }
    }

    return Array.from(questions).slice(0, 5);
  }

  extractKeyElements(content: string): string[] {
    const elementPatterns = [
      /(?:功能|特性|需求)[:：]\s*([^\n，,]+)/gi,
      /(?:用户|角色)[:：]\s*([^\n，,]+)/gi,
      /(?:目标|目的)[:：]\s*([^\n，,]+)/gi,
      /(?:约束|限制)[:：]\s*([^\n，,]+)/gi,
    ];

    const elements: Set<string> = new Set();

    for (const pattern of elementPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const element = match[1]?.trim();
        if (element && element.length > 2 && element.length < 100) {
          elements.add(element);
        }
      }
    }

    return Array.from(elements).slice(0, 10);
  }
}
