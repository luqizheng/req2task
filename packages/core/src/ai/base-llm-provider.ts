import axios, { AxiosInstance, AxiosError } from 'axios';
import { Readable } from 'stream';
import { LLMConfig } from '../entities/llm-config.entity';
import { LLMMessage, LLMOptions, LLMProvider, StreamChunk } from './llm-provider.interface';
import { LLMProviderType } from '@req2task/dto';

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 3;
const STREAM_TIMEOUT_MS = 120000;

export abstract class BaseLLMProvider implements LLMProvider {
  protected readonly client: AxiosInstance;
  protected readonly config: LLMConfig;

  abstract readonly providerType: LLMProviderType;

  constructor(config: LLMConfig) {
    this.config = config;
    this.client = this.createClient();
  }

  private createClient(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseUrl || this.getDefaultBaseUrl(),
      timeout: DEFAULT_TIMEOUT_MS,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  protected abstract getDefaultBaseUrl(): string;

  async generate(messages: LLMMessage[], options?: LLMOptions): Promise<{ content: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
    const requestBody = this.buildRequestBody(messages, { ...options, stream: false });
    
    try {
      const response = await this.executeWithRetry(() => 
        this.client.post('/chat/completions', requestBody)
      );
      
      return this.parseResponse(response.data);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async generateStream(messages: LLMMessage[], options?: LLMOptions): Promise<AsyncGenerator<StreamChunk>> {
    const requestBody = this.buildRequestBody(messages, { ...options, stream: true });
    const chunks: StreamChunk[] = [];
    let usage: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined;

    const response = await this.client.post('/chat/completions', requestBody, {
      responseType: 'stream',
      timeout: STREAM_TIMEOUT_MS,
    });

    const stream = response.data as Readable;
    const decoder = new TextDecoder();

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        const text = decoder.decode(chunk, { stream: true });
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              
              if (delta) {
                chunks.push({
                  content: delta,
                  done: false,
                });
              }

              if (parsed.usage) {
                usage = {
                  promptTokens: parsed.usage.prompt_tokens || 0,
                  completionTokens: parsed.usage.completion_tokens || 0,
                  totalTokens: parsed.usage.total_tokens || 0,
                };
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE message:', data);
            }
          }
        }
      });

      stream.on('end', () => {
        resolve();
      });

      stream.on('error', (error: Error) => {
        reject(error);
      });
    });

    chunks.push({
      content: '',
      done: true,
      usage,
    });

    const chunkArray = chunks;
    let index = 0;

    async function* generator(): AsyncGenerator<StreamChunk> {
      while (index < chunkArray.length) {
        yield chunkArray[index++];
      }
    }

    return generator();
  }

  protected buildRequestBody(messages: LLMMessage[], options?: LLMOptions): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.config.modelName,
      messages,
      stream: options?.stream ?? false,
    };

    if (options?.temperature !== undefined) {
      body.temperature = options.temperature;
    } else {
      body.temperature = this.config.temperature;
    }

    if (options?.maxTokens !== undefined) {
      body.max_tokens = options.maxTokens;
    } else {
      body.max_tokens = this.config.maxTokens;
    }

    if (options?.topP !== undefined) {
      body.top_p = options.topP;
    } else {
      body.top_p = this.config.topP;
    }

    if (options?.stop) {
      body.stop = options.stop;
    }

    return body;
  }

  protected parseResponse(data: Record<string, unknown>): { content: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } } {
    const choices = data.choices as Array<{ message?: { content?: string } }>;
    const content = choices?.[0]?.message?.content || '';
    const usage = data.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;

    return {
      content,
      usage: usage ? {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
      } : undefined,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.post('/chat/completions', {
        model: this.config.modelName,
        messages: [{ role: 'user' as const, content: 'ping' }],
        max_tokens: 1,
      });
      return true;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.warn(`Provider availability check failed: ${axiosError.message}`);
      return false;
    }
  }

  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= DEFAULT_MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        const axiosError = error as AxiosError;
        
        if (this.isRetryableError(axiosError) && attempt < DEFAULT_MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 100;
          console.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${DEFAULT_MAX_RETRIES})`);
          await this.sleep(delay);
        } else {
          throw error;
        }
      }
    }
    
    throw lastError;
  }

  private isRetryableError(error: AxiosError): boolean {
    if (!error.response) {
      return true;
    }
    const status = error.response.status;
    return status === 408 || status === 429 || status >= 500;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected handleError(error: unknown): void {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      const status = axiosError.response.status;
      const data = axiosError.response.data as Record<string, unknown> | undefined;
      const message = (data?.error as Record<string, unknown>)?.message as string || axiosError.message;
      
      console.error(`LLM API error [${status}]: ${message}`);
    } else if (axiosError.request) {
      console.error(`LLM API request failed: ${axiosError.message}`);
    } else {
      console.error(`LLM API error: ${axiosError.message}`);
    }
  }
}
