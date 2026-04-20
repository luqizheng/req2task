import OpenAI from 'openai';
import type { Message, FileAttachment } from '../types.js';

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

  constructor(apiKey: string, defaultModel: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;

    if (apiKey) {
      this.openAiClient = new OpenAI({ apiKey });
    }
  }

  async complete(
    messages: Message[],
    model?: string,
    files?: FileAttachment[]
  ): Promise<LLMResponse> {
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

  async *streamComplete(
    messages: Message[],
    model?: string,
    files?: FileAttachment[]
  ): AsyncGenerator<StreamChunk> {
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
