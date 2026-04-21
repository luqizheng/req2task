import axios, { AxiosInstance, AxiosError } from 'axios';
import { Readable } from 'stream';
import { TextDecoder } from 'util';
import { LLMConfig } from '../../database/entities/llm-config.entity.js';
import type { LLMMessage, LLMOptions, LLMProvider, StreamChunk, LLMResponse } from './types.js';
import { LLMError, LLMErrorCode } from './errors.js';
import { LLMProviderType } from '@req2task/dto';
import { CircuitBreaker } from './circuit-breaker.js';

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 3;
const STREAM_TIMEOUT_MS = 120000;

export abstract class BaseProvider implements LLMProvider {
  abstract readonly providerType: LLMProviderType;
  abstract readonly displayName: string;

  protected readonly client: AxiosInstance;
  protected readonly config: LLMConfig;
  protected readonly circuitBreaker = new CircuitBreaker();

  constructor(config: LLMConfig) {
    this.config = config;
    this.client = this.createClient();
  }

  private createClient(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseUrl || this.getDefaultBaseUrl(),
      timeout: DEFAULT_TIMEOUT_MS,
      headers: this.getHeaders(),
    });
  }

  protected abstract getDefaultBaseUrl(): string;

  protected getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async generate(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    if (this.circuitBreaker.isOpen()) {
      throw new LLMError('Circuit breaker is open', LLMErrorCode.CIRCUIT_OPEN, undefined, this.providerType);
    }

    const body = this.buildRequestBody(messages, { ...options, stream: false });

    try {
      const response = await this.executeWithRetry(() => this.client.post(this.getChatEndpoint(), body));
      return this.parseResponse(response.data);
    } catch (error) {
      this.handleError(error);
      throw this.transformError(error);
    }
  }

  async generateStream(messages: LLMMessage[], options?: LLMOptions): Promise<AsyncGenerator<StreamChunk>> {
    if (this.circuitBreaker.isOpen()) {
      throw new LLMError('Circuit breaker is open', LLMErrorCode.CIRCUIT_OPEN, undefined, this.providerType);
    }

    const body = this.buildRequestBody(messages, { ...options, stream: true });
    const chunks: StreamChunk[] = [];
    let usage: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined;
    let finishReason: string | undefined;

    try {
      const response = await this.client.post(this.getChatEndpoint(), body, {
        responseType: 'stream',
        timeout: STREAM_TIMEOUT_MS,
      });

      await this.processStream(response.data as Readable, chunks, (u, fr) => {
        usage = u;
        finishReason = fr;
      });

      chunks.push({ content: '', done: true, usage, finishReason });

      const chunkArray = chunks;
      let index = 0;
      return (async function* (): AsyncGenerator<StreamChunk> {
        while (index < chunkArray.length) yield chunkArray[index++];
      })();
    } catch (error) {
      this.handleError(error);
      throw this.transformError(error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.post(
        this.getChatEndpoint(),
        { model: this.config.modelName, messages: [{ role: 'user' as const, content: 'ping' }], max_tokens: 1 },
        { timeout: 5000 },
      );
      this.circuitBreaker.recordSuccess();
      return true;
    } catch {
      this.circuitBreaker.recordFailure();
      return false;
    }
  }

  protected getChatEndpoint(): string {
    return '/chat/completions';
  }

  protected buildRequestBody(messages: LLMMessage[], options?: LLMOptions): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: options?.model || this.config.modelName,
      messages,
      stream: options?.stream ?? false,
    };

    if (options?.temperature !== undefined) body.temperature = Number(options.temperature);
    else if (this.config.temperature !== undefined) body.temperature = Number(this.config.temperature);

    if (options?.maxTokens !== undefined) body.max_tokens = Number(options.maxTokens);
    else if (this.config.maxTokens) body.max_tokens = Number(this.config.maxTokens);

    if (options?.topP !== undefined) body.top_p = Number(options.topP);
    else if (this.config.topP !== undefined) body.top_p = Number(this.config.topP);

    if (options?.stop) body.stop = options.stop;

    return body;
  }

  protected parseResponse(data: Record<string, unknown>): LLMResponse {
    const choices = data.choices as Array<{ message?: { content?: string }; finish_reason?: string }>;
    return {
      content: choices?.[0]?.message?.content || '',
      finishReason: choices?.[0]?.finish_reason,
      usage: data.usage ? this.normalizeUsage(data.usage as Record<string, number>) : undefined,
    };
  }

  protected normalizeUsage(usage: Record<string, number>) {
    return {
      promptTokens: usage.prompt_tokens || usage.promptTokens || 0,
      completionTokens: usage.completion_tokens || usage.completionTokens || 0,
      totalTokens: usage.total_tokens || usage.totalTokens || 0,
    };
  }

  private async processStream(
    stream: Readable,
    chunks: StreamChunk[],
    onComplete: (usage?: { promptTokens: number; completionTokens: number; totalTokens: number }, finishReason?: string) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const decoder = new TextDecoder();
      let buffer = '';

      stream.on('data', (chunk: Buffer) => {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const parsed = this.parseStreamLine(line);
          if (parsed) {
            if (parsed.content) chunks.push({ content: parsed.content, done: false });
            if (parsed.usage) onComplete(parsed.usage, parsed.finishReason);
            if (parsed.finish) onComplete(undefined, parsed.finishReason);
          }
        }
      });

      stream.on('end', () => {
        if (buffer.trim()) {
          const parsed = this.parseStreamLine(buffer);
          if (parsed?.finish) onComplete(undefined, parsed.finishReason);
        }
        resolve();
      });

      stream.on('error', reject);
    });
  }

  protected parseStreamLine(line: string): StreamLineParseResult | null {
    if (!line.startsWith('data: ')) return null;
    const data = line.slice(6).trim();
    if (data === '[DONE]') return { finish: true };

    try {
      const parsed = JSON.parse(data);
      return {
        content: parsed.choices?.[0]?.delta?.content || '',
        finishReason: parsed.choices?.[0]?.finish_reason,
        usage: parsed.usage ? this.normalizeUsage(parsed.usage) : undefined,
        finish: !!parsed.choices?.[0]?.finish_reason,
      };
    } catch {
      return null;
    }
  }

  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= DEFAULT_MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (!this.isRetryableError(error as AxiosError) || attempt === DEFAULT_MAX_RETRIES) throw error;
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
    throw lastError;
  }

  private isRetryableError(error: AxiosError): boolean {
    if (!error.response) return true;
    const status = error.response.status;
    return status === 408 || status === 429 || status >= 500;
  }

  protected handleError(error: unknown): void {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      const data = axiosError.response.data as Record<string, unknown> | undefined;
      const message = ((data?.error as Record<string, unknown>)?.message as string) || axiosError.message;
      console.error(`[${this.providerType}] API error [${axiosError.response.status}]: ${message}`);
    } else if (axiosError.request) {
      console.error(`[${this.providerType}] Request failed: ${axiosError.message}`);
    } else {
      console.error(`[${this.providerType}] Error: ${axiosError.message}`);
    }
    this.circuitBreaker.recordFailure();
  }

  protected transformError(error: unknown): LLMError {
    if (error instanceof LLMError) return error;
    const axiosError = error as AxiosError;

    if (!axiosError.response) {
      return new LLMError(
        axiosError.code === 'ECONNABORTED' ? 'Request timeout' : axiosError.message || 'Network error',
        axiosError.code === 'ECONNABORTED' ? LLMErrorCode.TIMEOUT_ERROR : LLMErrorCode.NETWORK_ERROR,
        undefined,
        this.providerType,
        true,
      );
    }

    const status = axiosError.response.status;
    const data = axiosError.response.data as Record<string, unknown> | undefined;
    const message = ((data?.error as Record<string, unknown>)?.message as string) || axiosError.message;

    switch (status) {
      case 401:
      case 403:
        return new LLMError(`Authentication failed: ${message}`, LLMErrorCode.AUTHENTICATION_ERROR, status, this.providerType, false);
      case 429:
        return new LLMError(`Rate limit exceeded: ${message}`, LLMErrorCode.RATE_LIMIT_ERROR, status, this.providerType, true);
      case 400:
        if (message.includes('maximum context length') || message.includes('token limit')) {
          return new LLMError(`Context length exceeded: ${message}`, LLMErrorCode.CONTEXT_LENGTH_ERROR, status, this.providerType, false);
        }
        return new LLMError(`Bad request: ${message}`, LLMErrorCode.UNKNOWN_ERROR, status, this.providerType, false);
      default:
        return new LLMError(
          `Server error: ${message}`,
          status >= 500 ? LLMErrorCode.SERVER_ERROR : LLMErrorCode.UNKNOWN_ERROR,
          status,
          this.providerType,
          status >= 500,
        );
    }
  }
}

interface StreamLineParseResult {
  content?: string;
  finishReason?: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  finish?: boolean;
}
