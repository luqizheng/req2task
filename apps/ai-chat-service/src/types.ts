export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title?: string;
  collectionId?: string;
  rawRequirementId?: string;
  systemPrompt: string;
  messages: Message[];
  metadata: {
    questionCount: number;
    keyElements: string[];
    followUpQuestions: string[];
    isComplete: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessageRequest {
  content: string;
  files?: FileAttachment[];
  configId?: string;
}

export interface FileAttachment {
  type: 'text' | 'docx' | 'pdf' | 'audio';
  data: string;
  name?: string;
}

export interface StreamChunk {
  type: 'content' | 'metadata' | 'done' | 'error';
  content?: string;
  conversationId?: string;
  messageId?: string;
  followUpQuestions?: string[];
  keyElements?: string[];
  isComplete?: boolean;
  error?: string;
}

export interface CreateConversationRequest {
  collectionId?: string;
  rawRequirementId?: string;
  title?: string;
  systemPrompt?: string;
  configId?: string;
}

export interface LLMConfig {
  provider: 'openai' | 'ollama';
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface ConversationMetadata {
  questionCount: number;
  keyElements: string[];
  followUpQuestions: string[];
  isComplete: boolean;
}

export interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}
