import { ref, shallowRef } from 'vue';
import type { StreamChunk } from '../types';
import { adapterRegistry } from '../adapters';

export interface StreamOptions {
  endpoint: string;
  message: string;
  headers?: Record<string, string>;
  sessionId?: string;
  conversationId?: string;
  adapterName?: string;
  onChunk?: (chunk: StreamChunk) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function useStream() {
  const isStreaming = ref(false);
  const abortController = shallowRef<AbortController | null>(null);

  async function startStream(options: StreamOptions): Promise<void> {
    if (isStreaming.value) {
      abort();
    }

    abortController.value = new AbortController();
    isStreaming.value = true;

    const { endpoint, message, headers = {}, sessionId, conversationId, adapterName = 'default', onChunk, onComplete, onError } = options;

    try {
      let body: Record<string, unknown> = {
        message: message || '',
      };

      if (sessionId) {
        body.sessionId = sessionId;
      }
      if (conversationId) {
        body.conversationId = conversationId;
      }

      body = adapterRegistry.transformRequest(adapterName, body) as Record<string, unknown>;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
        signal: abortController.value.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (reader) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.trim() === 'data: [DONE]') {
            continue;
          }

          const dataPrefix = 'data: ';
          if (!line.startsWith(dataPrefix)) {
            continue;
          }

          const dataStr = line.substring(dataPrefix.length).trim();
          if (!dataStr) {
            continue;
          }

          try {
            let parsed = JSON.parse(dataStr);

            parsed = adapterRegistry.transformResponse(adapterName, parsed) as Record<string, unknown>;

            if (parsed.type === 'metadata' || parsed.conversationId) {
              onChunk?.({
                type: 'metadata',
                conversationId: parsed.conversationId,
                isNewConversation: parsed.isNewConversation,
              });
              continue;
            }

            if (parsed.type === 'content' && parsed.content) {
              onChunk?.({
                type: 'content',
                content: parsed.content,
              });
            }

            if (parsed.error) {
              throw new Error(parsed.error as string);
            }
          } catch (parseError) {
            if (parseError instanceof SyntaxError) {
              continue;
            }
            throw parseError;
          }
        }
      }

      onChunk?.({
        type: 'done',
      });
      onComplete?.();
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      isStreaming.value = false;
      abortController.value = null;
    }
  }

  function abort(): void {
    if (abortController.value) {
      abortController.value.abort();
      abortController.value = null;
    }
    isStreaming.value = false;
  }

  return {
    isStreaming,
    startStream,
    abort,
  };
}
