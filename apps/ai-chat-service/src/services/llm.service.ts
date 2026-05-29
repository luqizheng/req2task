import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { Message, FileAttachment, LLMConfigMetadata } from '../types.js';
import { LLMProviderType } from '../types.js';
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
  private defaultClient: BaseChatModel;

  constructor(defaultModel: string = 'gpt-4o-mini') {
    this.defaultModel = defaultModel;
    this.defaultClient = this.createDefaultClient();
  }

  private createDefaultClient(): BaseChatModel {
    logger.debug({ model: this.defaultModel }, 'Creating default LLM client');
    
    if (this.defaultModel.startsWith('claude')) {
      return new ChatAnthropic({
        model: this.defaultModel,
        temperature: 0.7,
        maxTokens: 2000,
      });
    }
    
    if (this.defaultModel.startsWith('llama') || this.defaultModel.startsWith('gemma')) {
      return new ChatOllama({
        model: this.defaultModel,
        temperature: 0.7,
      });
    }
    
    return new ChatOpenAI({
      model: this.defaultModel,
      temperature: 0.7,
      maxTokens: 2000,
    });
  }

  private createClientFromConfig(config: LLMConfigMetadata): BaseChatModel {
    const { provider, modelName, apiKey, baseUrl, temperature, maxTokens } = config;
    
    logger.debug({ provider, modelName, baseUrl }, 'Creating LLM client from config');

    switch (provider) {
      case LLMProviderType.DEEPSEEK:
        return new ChatOpenAI({
          model: modelName,
          temperature: Number(temperature),
          maxTokens: Number(maxTokens),
          apiKey: apiKey,
          configuration: {
            baseURL: baseUrl,
          },
        });
      case LLMProviderType.OLLAMA:
        return new ChatOllama({
          model: modelName,
          temperature: Number(temperature),
        });
      case LLMProviderType.ANTHROPIC:
        return new ChatAnthropic({
          model: modelName,
          temperature: Number(temperature),
          maxTokens: Number(maxTokens),
          apiKey: apiKey,
        });
      case LLMProviderType.OPENAI:
      default:
        return new ChatOpenAI({
          model: modelName,
          temperature: Number(temperature),
          maxTokens: Number(maxTokens),
          apiKey: apiKey,
          configuration: baseUrl ? { baseURL: baseUrl } : undefined,
        });
    }
  }

  private convertMessages(messages: Message[]): (SystemMessage | HumanMessage | AIMessage)[] {
    return messages.map((m) => {
      switch (m.role) {
        case 'system':
          return new SystemMessage(m.content);
        case 'assistant':
          return new AIMessage(m.content);
        case 'user':
        default:
          return new HumanMessage(m.content);
      }
    });
  }

  private processFiles(files?: FileAttachment[]): string {
    if (!files || files.length === 0) {
      return '';
    }

    return files
      .map((file, index) => {
        const fileName = file.name || `附件${index + 1}`;
        if (file.type === 'text') {
          return `[${fileName}]\n${file.data}`;
        }
        return `[${fileName}] (${file.type} 文件)\n${file.data}`;
      })
      .join('\n\n');
  }

  private enrichMessagesWithFiles(
    messages: Message[],
    files?: FileAttachment[],
  ): Message[] {
    const fileContents = this.processFiles(files);
    if (!fileContents) {
      return messages;
    }

    const enrichedMessages = [...messages];
    const systemMessageIndex = enrichedMessages.findIndex((m) => m.role === 'system');

    if (systemMessageIndex >= 0) {
      enrichedMessages[systemMessageIndex] = {
        ...enrichedMessages[systemMessageIndex],
        content: `${enrichedMessages[systemMessageIndex].content}\n\n[附加文件内容]\n${fileContents}`,
      };
    } else {
      enrichedMessages.unshift({
        id: '',
        role: 'system',
        content: `[附加文件内容]\n${fileContents}`,
        createdAt: new Date(),
      });
    }

    return enrichedMessages;
  }

  async complete(
    messages: Message[],
    model?: string,
    files?: FileAttachment[],
  ): Promise<LLMResponse> {
    logger.debug({ model: model || this.defaultModel, messageCount: messages.length, hasFiles: !!files }, 'LLM complete start');

    const enrichedMessages = this.enrichMessagesWithFiles(messages, files);
    const convertedMessages = this.convertMessages(enrichedMessages);

    const client = model && model !== this.defaultModel 
      ? this.createClientFromConfig({
          provider: LLMProviderType.OPENAI,
          modelName: model,
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
        })
      : this.defaultClient;

    const chain = client.pipe(new StringOutputParser());
    const response = await chain.invoke(convertedMessages);

    logger.debug({ contentLength: response.length }, 'LLM response received');

    return {
      content: response,
      finishReason: 'stop',
    };
  }

  async completeWithConfig(
    messages: Message[],
    config: LLMConfigMetadata,
    files?: FileAttachment[],
  ): Promise<LLMResponse> {
    logger.debug({ config: { ...config, apiKey: config.apiKey ? '***' : undefined }, messageCount: messages.length }, 'LLM completeWithConfig start');

    const enrichedMessages = this.enrichMessagesWithFiles(messages, files);
    const convertedMessages = this.convertMessages(enrichedMessages);

    const client = this.createClientFromConfig(config);
    const chain = client.pipe(new StringOutputParser());
    const response = await chain.invoke(convertedMessages);

    logger.debug({ contentLength: response.length }, 'LLM response received');

    return {
      content: response,
      finishReason: 'stop',
    };
  }

  async *streamComplete(
    messages: Message[],
    model?: string,
    files?: FileAttachment[],
  ): AsyncGenerator<StreamChunk> {
    logger.debug({ model: model || this.defaultModel, messageCount: messages.length, hasFiles: !!files }, 'LLM streamComplete start');

    const enrichedMessages = this.enrichMessagesWithFiles(messages, files);
    const convertedMessages = this.convertMessages(enrichedMessages);

    const client = model && model !== this.defaultModel
      ? this.createClientFromConfig({
          provider: LLMProviderType.OPENAI,
          modelName: model,
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
        })
      : this.defaultClient;

    const stream = await client.stream(convertedMessages);

    let totalContentLength = 0;

    for await (const chunk of stream) {
      const content = chunk.content as string;
      if (content) {
        totalContentLength += content.length;
        logger.debug({ contentLength: content.length, totalContentLength }, 'Stream chunk received');

        yield {
          content,
          done: false,
        };
      }
    }

    logger.debug({ totalContentLength }, 'LLM stream completed');

    yield {
      content: '',
      done: true,
    };
  }

  async *streamCompleteWithConfig(
    messages: Message[],
    config: LLMConfigMetadata,
    files?: FileAttachment[],
  ): AsyncGenerator<StreamChunk> {
    logger.debug({ config: { ...config, apiKey: config.apiKey ? '***' : undefined }, messageCount: messages.length }, 'LLM streamCompleteWithConfig start');

    const enrichedMessages = this.enrichMessagesWithFiles(messages, files);
    const convertedMessages = this.convertMessages(enrichedMessages);

    const client = this.createClientFromConfig(config);
    const stream = await client.stream(convertedMessages);

    let totalContentLength = 0;

    for await (const chunk of stream) {
      const content = chunk.content as string;
      if (content) {
        totalContentLength += content.length;
        logger.debug({ contentLength: content.length, totalContentLength }, 'Stream chunk received');

        yield {
          content,
          done: false,
        };
      }
    }

    logger.debug({ totalContentLength }, 'LLM stream completed');

    yield {
      content: '',
      done: true,
    };
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