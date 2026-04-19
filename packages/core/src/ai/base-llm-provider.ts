import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";
import { Readable } from "stream";
import { TextDecoder } from "util";
import { LLMConfig } from "../entities/llm-config.entity";
import {
  LLMMessage,
  LLMOptions,
  LLMProvider,
  StreamChunk,
  LLMResponse,
  LLMError,
  LLMErrorCode,
  IProviderConfig,
} from "./llm-provider.interface";
import { LLMProviderType } from "@req2task/dto";

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 3;
const STREAM_TIMEOUT_MS = 120000;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_MS = 60000;

interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number;
  state: "closed" | "open" | "half-open";
}

export abstract class BaseLLMProvider implements LLMProvider {
  abstract readonly providerType: LLMProviderType;
  abstract readonly displayName: string;

  protected readonly client: AxiosInstance;
  protected readonly config: LLMConfig;
  private readonly circuitBreaker: CircuitBreakerState = {
    failureCount: 0,
    lastFailureTime: 0,
    state: "closed",
  };

  constructor(config: LLMConfig) {
    this.config = config;
    this.client = this.createClient();
  }

  protected createClient(): AxiosInstance {
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
      "Content-Type": "application/json",
    };
  }

  async generate(
    messages: LLMMessage[],
    options?: LLMOptions,
  ): Promise<LLMResponse> {
    if (this.isCircuitOpen()) {
      throw new LLMError(
        "Circuit breaker is open",
        LLMErrorCode.CIRCUIT_OPEN,
        undefined,
        this.providerType,
      );
    }

    const requestBody = this.buildRequestBody(messages, {
      ...options,
      stream: false,
    });

    try {
      const response = await this.executeWithRetry(() =>
        this.client.post(this.getChatEndpoint(), requestBody),
      );
      return this.parseResponse(response.data);
    } catch (error) {
      this.handleError(error);
      throw this.transformError(error);
    }
  }

  async generateStream(
    messages: LLMMessage[],
    options?: LLMOptions,
  ): Promise<AsyncGenerator<StreamChunk>> {
    if (this.isCircuitOpen()) {
      throw new LLMError(
        "Circuit breaker is open",
        LLMErrorCode.CIRCUIT_OPEN,
        undefined,
        this.providerType,
      );
    }

    const requestBody = this.buildRequestBody(messages, {
      ...options,
      stream: true,
    });
    const chunks: StreamChunk[] = [];
    let usage:
      | { promptTokens: number; completionTokens: number; totalTokens: number }
      | undefined;
    let finishReason: string | undefined;

    try {
    
      console.warn(`[${this.providerType}] ge111111111111111111111111111111111111111nerateStream request: ${JSON.stringify(requestBody)} to ${this.config.baseUrl}${this.getChatEndpoint()}`);  
      const response = await this.client.post(
        this.getChatEndpoint(),
        requestBody,
        {
          responseType: "stream",
          timeout: STREAM_TIMEOUT_MS,
        },
      );

      const stream = response.data as Readable;
      const decoder = new TextDecoder();

      await this.processStream(stream, decoder, chunks, (u, fr) => {
        usage = u;
        finishReason = fr;
      });

      chunks.push({ content: "", done: true, usage, finishReason });

      const chunkArray = chunks;
      let index = 0;

      const generator = async function* (): AsyncGenerator<StreamChunk> {
        while (index < chunkArray.length) {
          yield chunkArray[index++];
        }
      };

      return generator();
    } catch (error) {
      this.handleError(error);
      throw this.transformError(error);
    }
  }

  protected async processStream(
    stream: Readable,
    decoder: TextDecoder,
    chunks: StreamChunk[],
    onComplete: (
      usage:
        | {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
          }
        | undefined,
      finishReason: string | undefined,
    ) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let buffer = "";

      stream.on("data", (chunk: Buffer) => {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const parsed = this.parseStreamLine(line);
          if (parsed) {
            if (parsed.content) {
              chunks.push({ content: parsed.content, done: false });
            }
            if (parsed.usage) {
              onComplete(parsed.usage, parsed.finishReason);
            }
            if (parsed.finish) {
              onComplete(undefined, parsed.finishReason);
            }
          }
        }
      });

      stream.on("end", () => {
        if (buffer.trim()) {
          const parsed = this.parseStreamLine(buffer);
          if (parsed?.finish) {
            onComplete(undefined, parsed.finishReason);
          }
        }
        resolve();
      });

      stream.on("error", (error: Error) => reject(error));
    });
  }

  protected parseStreamLine(line: string): StreamLineParseResult | null {
    if (!line.startsWith("data: ")) return null;

    const data = line.slice(6).trim();
    if (data === "[DONE]") {
      return { finish: true };
    }

    try {
      const parsed = JSON.parse(data);
      const delta = parsed.choices?.[0]?.delta?.content;
      const finishReason = parsed.choices?.[0]?.finish_reason;

      return {
        content: delta || "",
        finishReason,
        usage: parsed.usage ? this.normalizeUsage(parsed.usage) : undefined,
        finish: !!finishReason,
      };
    } catch {
      return null;
    }
  }

  protected getChatEndpoint(): string {
    return "/chat/completions";
  }

  protected buildRequestBody(
    messages: LLMMessage[],
    options?: LLMOptions,
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: options?.model || this.config.modelName,
      messages,
      stream: options?.stream ?? false,
    };

    if (options?.temperature !== undefined) {
      body.temperature = options.temperature;
    } else if (this.config.temperature !== undefined) {
      body.temperature = this.config.temperature;
    }

    if (options?.maxTokens !== undefined) {
      body.max_tokens = options.maxTokens;
    } else if (this.config.maxTokens) {
      body.max_tokens = this.config.maxTokens;
    }

    if (options?.topP !== undefined) {
      body.top_p = options.topP;
    } else if (this.config.topP !== undefined) {
      body.top_p = this.config.topP;
    }

    if (options?.stop) {
      body.stop = options.stop;
    }

    return body;
  }

  protected parseResponse(data: Record<string, unknown>): LLMResponse {
    const choices = data.choices as Array<{
      message?: { content?: string };
      finish_reason?: string;
    }>;

    const content = choices?.[0]?.message?.content || "";
    const finishReason = choices?.[0]?.finish_reason;
    const usage = data.usage as Record<string, number> | undefined;

    return {
      content,
      finishReason,
      usage: usage ? this.normalizeUsage(usage) : undefined,
    };
  }

  protected normalizeUsage(usage: Record<string, number>): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } {
    return {
      promptTokens: usage.prompt_tokens || usage.promptTokens || 0,
      completionTokens: usage.completion_tokens || usage.completionTokens || 0,
      totalTokens: usage.total_tokens || usage.totalTokens || 0,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.post(
        this.getChatEndpoint(),
        {
          model: this.config.modelName,
          messages: [{ role: "user" as const, content: "ping" }],
          max_tokens: 1,
        },
        { timeout: 5000 },
      );
      this.recordSuccess();
      return true;
    } catch {
      this.recordFailure();
      return false;
    }
  }

  protected isCircuitOpen(): boolean {
    if (this.circuitBreaker.state === "closed") return false;

    const now = Date.now();
    if (now - this.circuitBreaker.lastFailureTime > CIRCUIT_BREAKER_RESET_MS) {
      this.circuitBreaker.state = "half-open";
      this.circuitBreaker.failureCount = 0;
      return false;
    }

    return this.circuitBreaker.state === "open";
  }

  private recordFailure(): void {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitBreaker.state = "open";
    }
  }

  private recordSuccess(): void {
    this.circuitBreaker.failureCount = 0;
    this.circuitBreaker.state = "closed";
  }

  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    const maxRetries = DEFAULT_MAX_RETRIES;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (
          !this.isRetryableError(error as AxiosError) ||
          attempt === maxRetries
        ) {
          throw error;
        }

        const delay = Math.pow(2, attempt) * 100;
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private isRetryableError(error: AxiosError): boolean {
    if (!error.response) return true;

    const status = error.response.status;
    return status === 408 || status === 429 || status >= 500;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected handleError(error: unknown): void {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const status = axiosError.response.status;
      const data = axiosError.response.data as
        | Record<string, unknown>
        | undefined;
      const message =
        ((data?.error as Record<string, unknown>)?.message as string) ||
        axiosError.message;
      console.error(`[${this.providerType}] API error [${status}]: ${message}`);
    } else if (axiosError.request) {
      console.error(
        `[${this.providerType}] Request failed: ${axiosError.message}`,
      );
    } else {
      console.error(`[${this.providerType}] Error: ${axiosError.message}`);
    }

    this.recordFailure();
  }

  protected transformError(error: unknown): LLMError {
    const axiosError = error as AxiosError;

    if (error instanceof LLMError) return error;

    if (!axiosError.response) {
      if (axiosError.code === "ECONNABORTED") {
        return new LLMError(
          "Request timeout",
          LLMErrorCode.TIMEOUT_ERROR,
          undefined,
          this.providerType,
          true,
        );
      }
      return new LLMError(
        axiosError.message || "Network error",
        LLMErrorCode.NETWORK_ERROR,
        undefined,
        this.providerType,
        true,
      );
    }

    const status = axiosError.response.status;
    const data = axiosError.response.data as
      | Record<string, unknown>
      | undefined;
    const message =
      ((data?.error as Record<string, unknown>)?.message as string) ||
      axiosError.message;

    switch (status) {
      case 401:
      case 403:
        return new LLMError(
          `Authentication failed: ${message}`,
          LLMErrorCode.AUTHENTICATION_ERROR,
          status,
          this.providerType,
          false,
        );
      case 429:
        return new LLMError(
          `Rate limit exceeded: ${message}`,
          LLMErrorCode.RATE_LIMIT_ERROR,
          status,
          this.providerType,
          true,
        );
      case 400:
        if (
          message.includes("maximum context length") ||
          message.includes("token limit")
        ) {
          return new LLMError(
            `Context length exceeded: ${message}`,
            LLMErrorCode.CONTEXT_LENGTH_ERROR,
            status,
            this.providerType,
            false,
          );
        }
        return new LLMError(
          `Bad request: ${message}`,
          LLMErrorCode.UNKNOWN_ERROR,
          status,
          this.providerType,
          false,
        );
      default:
        return new LLMError(
          `Server error: ${message}`,
          status >= 500
            ? LLMErrorCode.SERVER_ERROR
            : LLMErrorCode.UNKNOWN_ERROR,
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
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finish?: boolean;
}
