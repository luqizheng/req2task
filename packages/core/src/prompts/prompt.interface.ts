export type PromptCategory =
  | 'requirement-generation'
  | 'task-breakdown'
  | 'requirement-review'
  | 'user-story-generation'
  | 'quality-assessment'
  | 'conversation'
  | 'custom';

export interface PromptParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;
  defaultValue?: string;
  description?: string;
}

export interface PromptTemplate {
  code: string;
  name: string;
  category: PromptCategory;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature?: number;
  maxTokens?: number;
  isActive?: boolean;
  parameters: PromptParameter[];
}

export interface RenderOptions {
  temperature?: number;
  maxTokens?: number;
}