import { Readable } from "stream";
import { TextDecoder } from "util";
import { LLMConfig } from "../entities/llm-config.entity";
import { BaseLLMProvider } from "./base-llm-provider";
import { LLMProviderType } from "@req2task/dto";
import {
  LLMMessage,
  LLMOptions,
  LLMResponse,
  StreamChunk,
} from "./llm-provider.interface";

const OLLAMA_BASE_URL = "http://localhost:11434";

interface OllamaStreamResponse {
  model: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaProvider extends BaseLLMProvider {
  readonly providerType = LLMProviderType.OLLAMA;
  readonly displayName = "Ollama";

  constructor(config: LLMConfig) {
    super(config);
  }

  protected getDefaultBaseUrl(): string {
    return OLLAMA_BASE_URL;
  }

  protected getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
    };
  }

  protected getChatEndpoint(): string {
    return "/api/generate";
  }

  protected buildRequestBody(
    messages: LLMMessage[],
    options?: LLMOptions,
  ): Record<string, unknown> {
    const systemMessages = messages.filter((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    const combinedPrompt = nonSystemMessages
      .map((m) =>
        m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.content}`,
      )
      .join("\n");

    const body: Record<string, unknown> = {
      model: options?.model || this.config.modelName,
      prompt: combinedPrompt,
      stream: options?.stream ?? false,
    };

    if (systemMessages.length > 0) {
      body.system = systemMessages.map((m) => m.content).join("\n");
    }

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

    if (Object.keys(opts).length > 0) {
      body.options = opts;
    }

    return body;
  }

  protected parseResponse(data: Record<string, unknown>): LLMResponse {
    const response = data as unknown as OllamaStreamResponse;

    return {
      content: response.response || "",
      usage: {
        promptTokens: response.prompt_eval_count || 0,
        completionTokens: response.eval_count || 0,
        totalTokens:
          (response.prompt_eval_count || 0) + (response.eval_count || 0),
      },
    };
  }

  async generateStream(
    messages: LLMMessage[],
    options?: LLMOptions,
  ): Promise<AsyncGenerator<StreamChunk>> {
    if (this.isCircuitOpen()) {
      throw new Error("Circuit breaker is open");
    }

    const requestBody = this.buildRequestBody(messages, {
      ...options,
      stream: true,
    });
    const chunks: StreamChunk[] = [];
    let usage:
      | { promptTokens: number; completionTokens: number; totalTokens: number }
      | undefined;

    try {
      const response = await this.client.post(
        this.getChatEndpoint(),
        requestBody,
        {
          responseType: "stream",
          timeout: 120000,
        },
      );

      const stream = response.data as Readable;
      const decoder = new TextDecoder();
      let buffer = "";

      await new Promise<void>((resolve, reject) => {
        stream.on("data", (chunk: Buffer) => {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const parsed = JSON.parse(line) as OllamaStreamResponse;

              chunks.push({
                content: parsed.response || "",
                done: false,
              });

              if (parsed.done) {
                usage = {
                  promptTokens: parsed.prompt_eval_count || 0,
                  completionTokens: parsed.eval_count || 0,
                  totalTokens:
                    (parsed.prompt_eval_count || 0) + (parsed.eval_count || 0),
                };
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        });

        stream.on("end", () => {
          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer) as OllamaStreamResponse;
              if (parsed.done) {
                usage = {
                  promptTokens: parsed.prompt_eval_count || 0,
                  completionTokens: parsed.eval_count || 0,
                  totalTokens:
                    (parsed.prompt_eval_count || 0) + (parsed.eval_count || 0),
                };
              }
            } catch {
              // Skip invalid JSON
            }
          }
          resolve();
        });

        stream.on("error", (error: Error) => reject(error));
      });

      chunks.push({ content: "", done: true, usage });

      const chunkArray = chunks;
      let index = 0;

      async function* generator(): AsyncGenerator<StreamChunk> {
        while (index < chunkArray.length) {
          yield chunkArray[index++];
        }
      }

      return generator();
    } catch (error) {
      this.handleError(error);
      throw this.transformError(error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.get("/tags", { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
