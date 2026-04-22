import OpenAI from 'openai';
import type { Message, FileAttachment, LLMConfigMetadata } from '../types.js';
import type { LLMProvider } from '../llm/providers/types.js';

export interface LLMResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'function_call' | null;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export class LLMService {
  private openAiClient: OpenAI | null = null;
  private apiKey: string;
  private defaultModel: string;
  private provider: LLMProvider | null = null;

  constructor(apiKeyOrProvider: string | LLMProvider, defaultModel: string = 'gpt-4o-mini') {
    if (typeof apiKeyOrProvider === 'string') {
      this.apiKey = apiKeyOrProvider;
      this.defaultModel = defaultModel;
      if (apiKeyOrProvider) {
        this.openAiClient = new OpenAI({ apiKey: apiKeyOrProvider });
      }
    } else {
      this.provider = apiKeyOrProvider;
      this.apiKey = '';
      this.defaultModel = defaultModel;
    }
  }

  async complete(
    messages: Message[],
    model?: string,
    files?: FileAttachment[]
  ): Promise<LLMResponse> {
    if (this.provider) {
      const processedMessages = this.processMessagesForProvider(messages);
      const response = await this.provider.generate(processedMessages);
      return {
        content: response.content,
        finishReason: (response.finishReason as LLMResponse['finishReason']) || null,
      };
    }

    if (!this.openAiClient) {
      throw new Error('OpenAI client not initialized. Please set OPENAI_API_KEY.');
    }

    const processedMessages = this.processFilesInMessages(messages, files);

    const response = await this.openAiClient.chat.completions.create({
      model: model || this.defaultModel,
      messages: processedMessages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const choice = response.choices[0];

    return {
      content: choice.message.content || '',
      finishReason: choice.finish_reason || null,
    };
  }

  async completeWithConfig(
    messages: Message[],
    config: LLMConfigMetadata,
    files?: FileAttachment[]
  ): Promise<LLMResponse> {
    const processedMessages = this.processFilesInMessages(messages, files);

    if (config.provider === 'openai' || config.provider === 'deepseek') {
      const client = new OpenAI({
        apiKey: this.apiKey || config.baseUrl ? 'placeholder' : this.apiKey,
        baseURL: config.baseUrl,
      });

      const response = await client.chat.completions.create({
        model: config.modelName,
        messages: processedMessages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: Number(config.temperature),
        max_tokens: Number(config.maxTokens),
      });

      const choice = response.choices[0];
      return {
        content: choice.message.content || '',
        finishReason: choice.finish_reason || null,
      };
    }

    if (config.provider === 'ollama') {
      const baseUrl = config.baseUrl || 'http://localhost:11434';
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.modelName,
          messages: processedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json() as { message: { content: string } };
      return {
        content: data.message?.content || '',
        finishReason: 'stop',
      };
    }

    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  async *streamComplete(
    messages: Message[],
    model?: string,
    files?: FileAttachment[]
  ): AsyncGenerator<StreamChunk> {
    if (this.provider) {
      const processedMessages = this.processMessagesForProvider(messages);
      const stream = await this.provider.generateStream(processedMessages);
      for await (const chunk of stream) {
        yield {
          content: chunk.content,
          done: chunk.done,
        };
      }
      return;
    }

    if (!this.openAiClient) {
      throw new Error('OpenAI client not initialized. Please set OPENAI_API_KEY.');
    }

    const processedMessages = this.processFilesInMessages(messages, files);

    const stream = await this.openAiClient.chat.completions.create({
      model: model || this.defaultModel,
      messages: processedMessages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: 0.7,
      max_tokens: 4000,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      const done = chunk.choices[0]?.finish_reason != null;

      yield {
        content,
        done,
      };
    }
  }

  private processFilesInMessages(
    messages: Message[],
    files?: FileAttachment[]
  ): Message[] {
    if (!files || files.length === 0) {
      return messages;
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

    const systemMessageIndex = messages.findIndex(m => m.role === 'system');
    const systemMessage = systemMessageIndex >= 0
      ? messages[systemMessageIndex]
      : null;

    const otherMessages = systemMessageIndex >= 0
      ? messages.filter((_, i) => i !== systemMessageIndex)
      : messages;

    const enrichedSystemMessage: Message = systemMessage
      ? {
          ...systemMessage,
          content: `${systemMessage.content}\n\n[附加文件内容]\n${fileContents}`,
        }
      : {
          id: '',
          role: 'system',
          content: `[附加文件内容]\n${fileContents}`,
          createdAt: new Date(),
        };

    return [enrichedSystemMessage, ...otherMessages];
  }

  private processMessagesForProvider(messages: Message[]): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    return messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));
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
