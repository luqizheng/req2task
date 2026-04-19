import { RenderService } from './render.service';
import { requirementPrompts } from './requirement.prompts';
import { taskPrompts } from './task.prompts';
import { qualityPrompts } from './quality.prompts';
import { reviewPrompts } from './review.prompts';
import { conflictPrompts } from './conflict.prompts';
import { conversationPrompts } from './conversation.prompts';
import {
  PromptTemplate,
  PromptCategory,
  RenderOptions,
} from './prompt.interface';

export interface RenderedPrompt {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
}

export class PromptService {
  private prompts: Map<string, PromptTemplate>;
  private renderService: RenderService;

  constructor(renderService: RenderService) {
    this.renderService = renderService;
    this.prompts = new Map();
    this.loadPrompts();
  }

  private loadPrompts(): void {
    const allPrompts = [
      ...requirementPrompts,
      ...taskPrompts,
      ...qualityPrompts,
      ...reviewPrompts,
      ...conflictPrompts,
      ...conversationPrompts,
    ];
    for (const prompt of allPrompts) {
      this.prompts.set(prompt.code, prompt);
    }
  }

  getByCode(code: string): PromptTemplate | undefined {
    return this.prompts.get(code);
  }

  getByCategory(category: PromptCategory): PromptTemplate[] {
    return Array.from(this.prompts.values()).filter(
      (p) => p.category === category,
    );
  }

  getAll(): PromptTemplate[] {
    return Array.from(this.prompts.values());
  }

  getActive(): PromptTemplate[] {
    return Array.from(this.prompts.values()).filter((p) => p.isActive !== false);
  }

  render(code: string, params: Record<string, unknown>): RenderedPrompt {
    const prompt = this.getByCode(code);
    if (!prompt) {
      throw new Error(`Prompt not found: ${code}`);
    }

    return {
      systemPrompt: prompt.systemPrompt,
      userPrompt: this.renderService.renderHandlebars(
        prompt.userPromptTemplate,
        params,
      ),
      temperature: prompt.temperature ?? 0.7,
      maxTokens: prompt.maxTokens ?? 2000,
    };
  }

  renderWithOptions(
    code: string,
    params: Record<string, unknown>,
    options?: RenderOptions,
  ): RenderedPrompt {
    const prompt = this.getByCode(code);
    if (!prompt) {
      throw new Error(`Prompt not found: ${code}`);
    }

    return {
      systemPrompt: prompt.systemPrompt,
      userPrompt: this.renderService.renderHandlebars(
        prompt.userPromptTemplate,
        params,
      ),
      temperature: options?.temperature ?? prompt.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? prompt.maxTokens ?? 2000,
    };
  }

  hasPrompt(code: string): boolean {
    return this.prompts.has(code);
  }

  getCategories(): PromptCategory[] {
    return Array.from(new Set(Array.from(this.prompts.values()).map((p) => p.category)));
  }
}