import ollama, { ChatResponse } from "ollama";
import { LLMConfig } from "../entities/llm-config.entity";
import { BaseLLMProvider } from "./base-llm-provider";
import { LLMProviderType } from "@req2task/dto";
import {
  LLMMessage,
  LLMOptions,
  LLMResponse,
  StreamChunk,
  LLMError,
  LLMErrorCode,
} from "./llm-provider.interface";

const OLLAMA_HOST = "http://localhost:11434";

export class OllamaProvider extends BaseLLMProvider {
  readonly providerType = LLMProviderType.OLLAMA;
  readonly displayName = "Ollama";

  constructor(config: LLMConfig) {
    super(config);
  }

  protected getDefaultBaseUrl(): string {
    return OLLAMA_HOST;
  }

  protected getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
    };
  }

  protected getChatEndpoint(): string {
    return "";
  }

  protected buildRequestBody(
    messages: LLMMessage[],
    options?: LLMOptions,
  ): Record<string, unknown> {
    return {
      model: options?.model || this.config.modelName,
      messages,
      stream: options?.stream ?? false,
    };
  }

  protected parseResponse(data: Record<string, unknown>): LLMResponse {
    const response = data as unknown as ChatResponse;
    return {
      content: response.message?.content || "",
      usage: {
        promptTokens: response.prompt_eval_count || 0,
        completionTokens: response.eval_count || 0,
        totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
      },
      finishReason: response.done ? "stop" : undefined,
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

    try {
      debugger
      const model = options?.model || this.config.modelName;
      const response = await ollama.chat({
        model,
        messages,
        stream: false,
        options: this.buildOptions(options),
      });

      return this.parseResponse(response as unknown as Record<string, unknown>);
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

    const model = options?.model || this.config.modelName;
    const chunks: StreamChunk[] = [];
    let usage:
      | { promptTokens: number; completionTokens: number; totalTokens: number }
      | undefined;
    let finishReason: string | undefined;

    try {
      const response = await ollama.chat({
        model,
        messages,
        stream: true,
        options: this.buildOptions(options),
      });

      for await (const part of response) {
        if (part.message?.content) {
          chunks.push({
            content: part.message.content,
            done: false,
          });
        }

        if (part.done) {
          usage = {
            promptTokens: part.prompt_eval_count || 0,
            completionTokens: part.eval_count || 0,
            totalTokens:
              (part.prompt_eval_count || 0) + (part.eval_count || 0),
          };
          finishReason = "stop";
          chunks.push({ content: "", done: true, usage, finishReason });
          break;
        }
      }

      const chunkArray = chunks;
      let index = 0;

      const generator = (async function* (): AsyncGenerator<StreamChunk> {
        while (index < chunkArray.length) {
          yield chunkArray[index++];
        }
      })();

      return generator;
    } catch (error) {
      this.handleError(error);
      throw this.transformError(error);
    }
  }

  private buildOptions(options?: LLMOptions): Record<string, unknown> {
    const opts: Record<string, unknown> = {};

    if (options?.temperature !== undefined) {
      opts.temperature = options.temperature;
    } else if (this.config.temperature !== undefined) {
      opts.temperature = this.config.temperature;
    }

    if (options?.maxTokens !== undefined) {
      opts.num_predict = options.maxTokens;
    } else if (this.config.maxTokens) {
      opts.num_predict = this.config.maxTokens;
    }

    if (options?.topP !== undefined) {
      opts.top_p = options.topP;
    } else if (this.config.topP !== undefined) {
      opts.top_p = this.config.topP;
    }

    if (options?.stop) {
      opts.stop = options.stop;
    }

    return opts;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await ollama.list();
      return !!response.models;
    } catch {
      return false;
    }
  }
}
