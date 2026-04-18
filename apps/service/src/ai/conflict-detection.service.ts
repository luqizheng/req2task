import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LLMService,
  PromptService,
  ChromaVectorStore,
  LLMMessage,
  SearchResult,
} from '@req2task/core';
import { RawRequirement } from '@req2task/core';
import { ConflictType } from '@req2task/dto';
import {
  ConflictDetectionResultDto,
  ConflictDto,
  SearchResultDto,
} from '@req2task/dto';

@Injectable()
export class ConflictDetectionService {
  constructor(
    @InjectRepository(RawRequirement)
    private rawRequirementRepository: Repository<RawRequirement>,
    private llmService: LLMService,
    private promptService: PromptService,
    private vectorStore: ChromaVectorStore,
  ) {}

  async detectConflicts(
    requirementId: string,
    configId?: string,
  ): Promise<ConflictDetectionResultDto> {
    const requirement = await this.rawRequirementRepository.findOne({
      where: { id: requirementId },
    });

    if (!requirement) {
      return {
        hasConflict: false,
        conflicts: [],
        relatedRequirements: [],
      };
    }

    const relatedRequirements = await this.vectorStore.search(
      requirement.originalContent,
      10,
    );

    if (relatedRequirements.length === 0) {
      return {
        hasConflict: false,
        conflicts: [],
        relatedRequirements: [],
      };
    }

    const conflicts = await this.analyzeConflicts(
      requirement.originalContent,
      relatedRequirements,
      configId,
    );

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      relatedRequirements,
    };
  }

  async semanticSearch(
    query: string,
    limit: number = 10,
  ): Promise<SearchResultDto[]> {
    const results = await this.vectorStore.search(query, limit);
    return results;
  }

  async chat(
    messages: LLMMessage[],
    contextRequirementId?: string,
    configId?: string,
  ): Promise<{ content: string; context?: string }> {
    let context = '';

    if (contextRequirementId) {
      const requirement = await this.rawRequirementRepository.findOne({
        where: { id: contextRequirementId },
      });

      if (requirement) {
        context = `\n\nContext - Current requirement:\n${requirement.originalContent}\n`;

        const related = await this.vectorStore.search(
          requirement.originalContent,
          3,
        );

        if (related.length > 0) {
          context += '\nRelated requirements:\n';
          for (const r of related) {
            context += `- ${r.content}\n`;
          }
        }
      }
    }

    const systemPrompt = `You are a helpful requirements analyst assistant. ${context}`;

    const enhancedMessages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const response = await this.llmService.generate(enhancedMessages, configId);

    return {
      content: response.content,
      context: context || undefined,
    };
  }

  private async analyzeConflicts(
    targetRequirement: string,
    relatedRequirements: SearchResult[],
    configId?: string,
  ): Promise<ConflictDto[]> {
    const requirementsText = relatedRequirements
      .map((r, i) => `${i + 1}. ${r.content}`)
      .join('\n');

    const rendered = this.promptService.render('CONFLICT_DETECTION', {
      requirements: `Target: ${targetRequirement}\n\n${requirementsText}`,
    });

    const messages: LLMMessage[] = [
      { role: 'system', content: rendered.systemPrompt },
      { role: 'user', content: rendered.userPrompt },
    ];

    const response = await this.llmService.chatWithConfig(messages, configId, {
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });

    return this.parseConflicts(response.content, targetRequirement, relatedRequirements);
  }

  private parseConflicts(
    content: string,
    targetRequirement: string,
    relatedRequirements: SearchResult[],
  ): ConflictDto[] {
    const conflicts: ConflictDto[] = [];
    const conflictBlocks = content.split(/\n(?=\d+\.|Conflict)/i);

    for (const block of conflictBlocks) {
      if (!block.trim()) continue;

      const typeMatch = block.match(/Type:\s*(logical|temporal|functional|resource)/i);
      const descMatch = block.match(/Description:\s*([\s\S]*?)(?=Suggestion|$)/i);
      const suggestionMatch = block.match(/Suggestion:\s*([\s\S]*?)$/i);

      if (typeMatch && descMatch) {
        const type = typeMatch[1].toLowerCase() as ConflictType;
        const related = relatedRequirements[0];

        conflicts.push({
          requirement1: {
            id: 'target',
            content: targetRequirement,
          },
          requirement2: {
            id: related?.id || 'unknown',
            content: related?.content || '',
          },
          type,
          description: descMatch[1].trim(),
          suggestion: suggestionMatch?.[1]?.trim() || 'No suggestion provided',
        });
      }
    }

    return conflicts;
  }
}
