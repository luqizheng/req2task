export interface AnalyzeStartEvent {
  type: "analyze_start";
  collectionId: string;
  prompts?: { systemPrompt: string; userPrompt: string };
  requirementFiles?: Array<{ type: string; data: string; name?: string }>;
  projectAttachments?: Array<{ type: string; data: string; name?: string }>;
}

export interface ConversationStartEvent {
  type: "conversation_start";
  conversationId: string;
  isNewConversation?: boolean;
}

export interface ContentEvent {
  type: "content";
  content: string;
}

export interface MessageEvent {
  type: "message";
  message: {
    id: string;
    conversationId: string;
    role: string;
    content: string;
    createdAt: string;
  };
}

export interface AiQuestion {
  question: string;
  purpose?: string;
}

export interface DoneEvent {
  type: "done";
  followUpQuestions?: string[];
  keyElements?: string[];
  questions?: AiQuestion[];
  extractedData?: Record<string, unknown>;
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export type SSEEvent =
  | AnalyzeStartEvent
  | ConversationStartEvent
  | ContentEvent
  | MessageEvent
  | DoneEvent
  | ErrorEvent;

export interface StreamCallbacks {
  onAnalyzeStart?: (event: AnalyzeStartEvent) => void;
  onConversationStart?: (event: ConversationStartEvent) => void;
  onContent?: (content: string) => void;
  onMessage?: (event: MessageEvent) => void;
  onDone?: (event: DoneEvent) => void;
  onError?: (error: ErrorEvent) => void;
}

export interface UseSSEStreamOptions {
  url: string;
}

export function useSSEStream(options: UseSSEStreamOptions) {
  const parseSSEEvent = (data: string): SSEEvent | null => {
    try {
      return JSON.parse(data) as SSEEvent;
    } catch {
      return null;
    }
  };

  const handleSSEEvent = (event: SSEEvent, callbacks: StreamCallbacks) => {
    switch (event.type) {
      case "analyze_start":
        callbacks.onAnalyzeStart?.(event);
        break;
      case "conversation_start":
        callbacks.onConversationStart?.(event);
        break;
      case "content":
        callbacks.onContent?.(event.content);
        break;
      case "message":
        callbacks.onMessage?.(event);
        break;
      case "done":
        callbacks.onDone?.(event);
        break;
      case "error":
        callbacks.onError?.(event);
        break;
    }
  };

  const submitStream = async (body: any, callbacks: StreamCallbacks) => {
    const token = localStorage.getItem("accessToken");
    const requestBody = JSON.stringify(body);

    const response = await fetch(options.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: requestBody,
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法读取响应流");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              callbacks.onDone?.({ type: "done" });
              return;
            }

            const event = parseSSEEvent(data);
            if (event) {
              handleSSEEvent(event, callbacks);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  return {
    submitStream,
    parseSSEEvent,
    handleSSEEvent,
  };
}
