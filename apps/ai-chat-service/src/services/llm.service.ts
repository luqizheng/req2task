import LLM from '@themaximalist/llm.js';
import type { Message, FileAttachment, LLMConfigMetadata } from '../types.js';
import type { Options } from '@themaximalist/llm.js';
import { logger } from '../utils/logger.js';

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
    logger.debug({ model: model || this.defaultModel, messageCount: messages.length, hasFiles: !!files }, 'LLM complete start');
    
    const processedMessages = this.processMessages(messages, files);
    logger.debug({ processedCount: processedMessages.length }, 'Messages processed');
    
    const options: Options = {
      model: model || this.defaultModel,
      extended: true,
    };
    logger.debug({ options }, 'LLM options prepared');

    const response = await LLM(processedMessages, options);
    logger.debug({ responseType: typeof response }, 'LLM response received');

    if (typeof response === 'string') {
      logger.debug({ contentLength: response.length }, 'Response is string');
      return {
        content: response,
        finishReason: null,
      };
    }

    const typedResponse = response as {
      content: string;
      finishReason?: string;
    };

    logger.debug({ contentLength: typedResponse.content?.length, finishReason: typedResponse.finishReason }, 'Response parsed');
    
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
    logger.debug({ config: { ...config, apiKey: config.apiKey ? '***' : undefined }, messageCount: messages.length }, 'LLM completeWithConfig start');
    
    const processedMessages = this.processMessages(messages, files);
    logger.debug({ processedCount: processedMessages.length }, 'Messages processed');
    
    const options: Options = {
      model: config.modelName,
      service: config.provider,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      temperature: Number(config.temperature),
      max_tokens: Number(config.maxTokens),
      extended: true,
    };
    logger.debug({ model: config.modelName, service: config.provider, baseUrl: config.baseUrl }, 'LLM options prepared with config');

    const response = await LLM(processedMessages, options);
    logger.debug({ responseType: typeof response }, 'LLM response received');

    if (typeof response === 'string') {
      logger.debug({ contentLength: response.length }, 'Response is string');
      return {
        content: response,
        finishReason: null,
      };
    }

    const typedResponse = response as {
      content: string;
      finishReason?: string;
    };

    logger.debug({ contentLength: typedResponse.content?.length, finishReason: typedResponse.finishReason }, 'Response parsed');
    
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
    logger.debug({ model: model || this.defaultModel, messageCount: messages.length, hasFiles: !!files }, 'LLM streamComplete start');
    
    const processedMessages = this.processMessages(messages, files);
    logger.debug({ processedCount: processedMessages.length }, 'Messages processed');
    
    const options: Options = {
      model: model || this.defaultModel,
      stream: true,
      extended: true,
    };
    logger.debug({ options }, 'LLM stream options prepared');

    const response = await LLM(processedMessages, options) as unknown as {
      stream: AsyncGenerator<Record<string, unknown>>;
    };
    logger.debug('LLM stream response obtained');

    let chunkCount = 0;
    let totalContentLength = 0;
    
    for await (const chunk of response.stream) {
      logger.debug({ chunkType: chunk.type, chunkKeys: Object.keys(chunk) }, 'Stream chunk received');
      
      if (chunk.type === 'content' && typeof chunk.content === 'string') {
        chunkCount++;
        totalContentLength += chunk.content.length;
        logger.debug({ chunkCount, contentLength: chunk.content.length, totalContentLength }, 'Content chunk processed');
        
        yield {
          content: chunk.content,
          done: false,
        };
      } else if (chunk.type === 'thinking' && typeof chunk.content === 'string') {
        logger.debug({ thinkingLength: chunk.content.length }, 'Thinking chunk received');
      } else {
        logger.debug({ chunk }, 'Other chunk type received');
      }
    }

    logger.debug({ totalChunks: chunkCount, totalContentLength }, 'LLM stream completed');
    
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
    logger.debug({ config: { ...config, apiKey: config.apiKey ? '***' : undefined }, messageCount: messages.length }, 'LLM streamCompleteWithConfig start');
    
    const processedMessages = this.processMessages(messages, files);
    logger.debug({ processedCount: processedMessages.length }, 'Messages processed');
    
    const options: Options = {
      model: config.modelName,
      service: config.provider,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      temperature: Number(config.temperature),
      max_tokens: Number(config.maxTokens),
      stream: true,
      extended: true,
    };
    logger.debug({ model: config.modelName, service: config.provider, baseUrl: config.baseUrl }, 'LLM stream options prepared with config');

    const response = await LLM(processedMessages, options) as unknown as {
      stream: AsyncGenerator<Record<string, unknown>>;
    };
    logger.debug('LLM stream response obtained');

    let chunkCount = 0;
    let totalContentLength = 0;
    
    for await (const chunk of response.stream) {
      logger.debug({ chunkType: chunk.type, chunkKeys: Object.keys(chunk) }, 'Stream chunk received');
      
      if (chunk.type === 'content' && typeof chunk.content === 'string') {
        chunkCount++;
        totalContentLength += chunk.content.length;
        logger.debug({ chunkCount, contentLength: chunk.content.length, totalContentLength }, 'Content chunk processed');
        
        yield {
          content: chunk.content,
          done: false,
        };
      } else if (chunk.type === 'thinking' && typeof chunk.content === 'string') {
        logger.debug({ thinkingLength: chunk.content.length }, 'Thinking chunk received');
      } else {
        logger.debug({ chunk }, 'Other chunk type received');
      }
    }

    logger.debug({ totalChunks: chunkCount, totalContentLength }, 'LLM stream completed');
    
    yield {
      content: '',
      done: true,
    };
  }

  private processMessages(
    messages: Message[],
    files?: FileAttachment[]
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    logger.debug({ messageCount: messages.length, hasFiles: !!files }, 'processMessages called');
    
    const baseMessages = messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));
    logger.debug({ baseMessageCount: baseMessages.length, roles: baseMessages.map(m => m.role) }, 'Base messages extracted');

    if (!files || files.length === 0) {
      logger.debug('No files, returning base messages');
      return baseMessages;
    }

    logger.debug({ fileCount: files.length, fileNames: files.map(f => f.name) }, 'Processing files');

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

    logger.debug({ hasEnrichedSystem: !!systemMessage, totalOutput: [enrichedSystemMessage, ...otherMessages].length }, 'Messages processed with files');
    
    return [enrichedSystemMessage, ...otherMessages];
  }

  extractFollowUpQuestions(content: string): string[] {
    logger.debug({ contentLength: content.length }, 'extractFollowUpQuestions called');
    
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

    const result = Array.from(questions).slice(0, 5);
    logger.debug({ extractedCount: result.length }, 'extractFollowUpQuestions result');
    
    return result;
  }

  extractKeyElements(content: string): string[] {
    logger.debug({ contentLength: content.length }, 'extractKeyElements called');
    
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

    const result = Array.from(elements).slice(0, 10);
    logger.debug({ extractedCount: result.length }, 'extractKeyElements result');
    
    return result;
  }
}
