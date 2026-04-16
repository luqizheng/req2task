import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LLMService,
  PromptService,
  ChromaVectorStore,
  LLMMessage,
  VectorDocument,
} from '@req2task/core';
import { RawRequirement, RawRequirementStatus } from '@req2task/core';
import {
  Priority,
  RequirementSource,
  RequirementStatus,
} from '@req2task/core';

export interface GenerateRequirementResult {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  acceptanceCriteria: string[];
  userStories: {
    role: string;
    goal: string;
    benefit: string;
  }[];
}

@Injectable()
export class RequirementGenerationService {
  constructor(
    @InjectRepository(RawRequirement)
    private rawRequirementRepository: Repository<RawRequirement>,
    private llmService: LLMService,
    private promptService: PromptService,
    private vectorStore: ChromaVectorStore,
  ) {}

  async createRawRequirement(
    moduleId: string,
    content: string,
    createdById: string,
  ): Promise<RawRequirement> {
    const rawRequirement = this.rawRequirementRepository.create({
      moduleId,
      originalContent: content,
      status: RawRequirementStatus.PENDING,
      createdById,
    });

    return this.rawRequirementRepository.save(rawRequirement);
  }

  async generateRequirement(
    rawRequirementId: string,
    configId?: string,
  ): Promise<GenerateRequirementResult> {
    const rawRequirement = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
    });

    if (!rawRequirement) {
      throw new BadRequestException('Raw requirement not found');
    }

    try {
      await this.rawRequirementRepository.update(rawRequirementId, {
        status: RawRequirementStatus.PROCESSING,
      });

      const template = this.promptService.renderTemplate('requirement_generation', {
        input: rawRequirement.originalContent,
      });

      const messages: LLMMessage[] = [
        { role: 'system', content: 'You are a helpful requirements analyst.' },
        { role: 'user', content: template },
      ];

      const response = await this.llmService.generate(messages, configId);

      const parsed = this.parseGeneratedContent(response.content);

      await this.rawRequirementRepository.update(rawRequirementId, {
        status: RawRequirementStatus.COMPLETED,
        generatedContent: response.content,
      });

      await this.vectorStore.add([
        {
          id: rawRequirementId,
          content: rawRequirement.originalContent,
          metadata: {
            moduleId: rawRequirement.moduleId,
            type: 'raw_requirement',
          },
        },
        {
          id: `${rawRequirementId}-generated`,
          content: response.content,
          metadata: {
            moduleId: rawRequirement.moduleId,
            type: 'generated_requirement',
          },
        },
      ]);

      return {
        id: rawRequirementId,
        ...parsed,
      };
    } catch (error) {
      await this.rawRequirementRepository.update(rawRequirementId, {
        status: RawRequirementStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async generateUserStories(
    requirementContent: string,
    configId?: string,
  ): Promise<{ role: string; goal: string; benefit: string }[]> {
    const template = this.promptService.renderTemplate('user_story_generation', {
      requirement: requirementContent,
    });

    const messages: LLMMessage[] = [
      { role: 'system', content: 'You are a helpful requirements analyst.' },
      { role: 'user', content: template },
    ];

    const response = await this.llmService.generate(messages, configId);
    return this.parseUserStories(response.content);
  }

  async generateAcceptanceCriteria(
    requirementContent: string,
    configId?: string,
  ): Promise<string[]> {
    const prompt = `Generate acceptance criteria for the following requirement:

${requirementContent}

Provide 3-5 acceptance criteria in the Given-When-Then format.`;

    const messages: LLMMessage[] = [
      { role: 'system', content: 'You are a helpful requirements analyst.' },
      { role: 'user', content: prompt },
    ];

    const response = await this.llmService.generate(messages, configId);
    return this.parseAcceptanceCriteria(response.content);
  }

  async findByModule(moduleId: string): Promise<RawRequirement[]> {
    return this.rawRequirementRepository.find({
      where: { moduleId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<RawRequirement | null> {
    return this.rawRequirementRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });
  }

  private parseGeneratedContent(content: string): Omit<GenerateRequirementResult, 'id'> {
    const titleMatch = content.match(/Title:\s*(.+)/i);
    const descMatch = content.match(/Description:\s*([\s\S]*?)(?=Acceptance|User\s*Story|$)/i);
    const priorityMatch = content.match(/Priority:\s*(critical|high|medium|low)/i);

    const title = titleMatch?.[1]?.trim() || 'Untitled Requirement';
    const description = descMatch?.[1]?.trim() || '';
    const priority = (priorityMatch?.[1]?.toLowerCase() as Priority) || Priority.MEDIUM;

    const acceptanceCriteria = this.parseAcceptanceCriteria(content);
    const userStories = this.parseUserStories(content);

    return {
      title,
      description,
      priority,
      acceptanceCriteria,
      userStories,
    };
  }

  private parseUserStories(content: string): { role: string; goal: string; benefit: string }[] {
    const stories: { role: string; goal: string; benefit: string }[] = [];
    const regex = /As a\s+(.+?),?\s*I want\s+(.+?),?\s+so that\s+(.+?)(?:\n|$)/gi;
    let match;

    while ((match = regex.exec(content)) !== null) {
      stories.push({
        role: match[1].trim(),
        goal: match[2].trim(),
        benefit: match[3].trim(),
      });
    }

    return stories;
  }

  private parseAcceptanceCriteria(content: string): string[] {
    const criteria: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith('Given') ||
        trimmed.startsWith('When') ||
        trimmed.startsWith('Then') ||
        /^\d+[.)]\s*/.test(trimmed)
      ) {
        criteria.push(trimmed.replace(/^\d+[.)]\s*/, ''));
      }
    }

    return criteria;
  }
}
