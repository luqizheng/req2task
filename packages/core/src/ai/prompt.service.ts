import { Injectable } from '@nestjs/common';

export interface PromptTemplate {
  name: string;
  template: string;
  description?: string;
}

@Injectable()
export class PromptService {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initDefaultTemplates();
  }

  private initDefaultTemplates(): void {
    this.templates.set('requirement_generation', {
      name: 'requirement_generation',
      description: 'Generate structured requirements from raw input',
      template: `You are a requirements analyst. Generate structured requirements from the following raw requirement:

Raw Requirement: {input}

Generate a structured requirement with:
1. Title (concise summary)
2. Description (detailed explanation)
3. Acceptance criteria (3-5 testable conditions)
4. Priority (critical/high/medium/low)
5. Dependencies (if any)`,
    });

    this.templates.set('user_story_generation', {
      name: 'user_story_generation',
      description: 'Generate user story from requirement',
      template: `You are a requirements analyst. Generate user stories for the following requirement:

Requirement: {requirement}

Generate user stories in the format:
As a [role], I want [goal] so that [benefit].`,
    });

    this.templates.set('conflict_detection', {
      name: 'conflict_detection',
      description: 'Detect conflicts between requirements',
      template: `You are a requirements analyst. Analyze the following requirements and detect any conflicts:

Requirements:
{requirements}

For each potential conflict, provide:
1. Conflicting requirements
2. Type of conflict
3. Resolution suggestion`,
    });

    this.templates.set('task_decomposition', {
      name: 'task_decomposition',
      description: 'Decompose requirement into tasks',
      template: `You are a project manager. Decompose the following requirement into actionable tasks:

Requirement: {requirement}

For each task provide:
1. Task title
2. Estimated hours
3. Priority
4. Dependencies`,
    });
  }

  getTemplate(name: string): PromptTemplate | undefined {
    return this.templates.get(name);
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  renderTemplate(name: string, variables: Record<string, string>): string {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`Template not found: ${name}`);
    }

    let rendered = template.template;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    return rendered;
  }

  addTemplate(template: PromptTemplate): void {
    this.templates.set(template.name, template);
  }

  updateTemplate(name: string, template: Partial<PromptTemplate>): void {
    const existing = this.templates.get(name);
    if (existing) {
      this.templates.set(name, { ...existing, ...template });
    }
  }

  deleteTemplate(name: string): void {
    this.templates.delete(name);
  }
}
