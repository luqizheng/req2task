import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LLMService,
  PromptService,
  ChromaVectorStore,
  LLMMessage,
} from '@req2task/core';
import { Task, TaskPriority } from '@req2task/core';

export interface TaskDecomposition {
  tasks: {
    title: string;
    estimatedHours: number;
    priority: TaskPriority;
    dependencies: string[];
    description: string;
  }[];
  totalEstimatedHours: number;
}

export interface SimilarRecommendation {
  requirementId: string;
  content: string;
  similarity: number;
  reason: string;
}

@Injectable()
export class TaskDecompositionService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private llmService: LLMService,
    private promptService: PromptService,
    private vectorStore: ChromaVectorStore,
  ) {}

  async decomposeRequirement(
    requirementContent: string,
    configId?: string,
  ): Promise<TaskDecomposition> {
    const template = this.promptService.renderTemplate('task_decomposition', {
      requirement: requirementContent,
    });

    const messages: LLMMessage[] = [
      { role: 'system', content: 'You are a project manager.' },
      { role: 'user', content: template },
    ];

    const response = await this.llmService.generate(messages, configId);
    return this.parseDecompositionResult(response.content);
  }

  async estimateWorkload(
    requirementContent: string,
    configId?: string,
  ): Promise<{ estimatedHours: number; reasoning: string }> {
    const prompt = `Estimate the workload for implementing the following requirement:

${requirementContent}

Provide:
1. Estimated hours (a number)
2. Brief reasoning explaining the estimate

Format:
Hours: [number]
Reasoning: [explanation]`;

    const messages: LLMMessage[] = [
      { role: 'system', content: 'You are a project manager.' },
      { role: 'user', content: prompt },
    ];

    const response = await this.llmService.generate(messages, configId);
    return this.parseWorkloadEstimate(response.content);
  }

  async findSimilarRequirements(
    requirementContent: string,
    moduleId: string,
    limit: number = 5,
  ): Promise<SimilarRecommendation[]> {
    const results = await this.vectorStore.search(requirementContent, limit * 2);

    const similar: SimilarRecommendation[] = [];

    for (const result of results) {
      if (result.metadata?.moduleId === moduleId) {
        similar.push({
          requirementId: result.id,
          content: result.content,
          similarity: result.score,
          reason: `语义相似度: ${(result.score * 100).toFixed(1)}%`,
        });
      }

      if (similar.length >= limit) break;
    }

    return similar;
  }

  async generateSubTasks(
    parentTaskId: string,
    configId?: string,
  ): Promise<TaskDecomposition> {
    const parentTask = await this.taskRepository.findOne({
      where: { id: parentTaskId },
      relations: ['requirement'],
    });

    if (!parentTask) {
      throw new Error('Parent task not found');
    }

    const content = `Task: ${parentTask.title}\n${parentTask.description || ''}`;
    return this.decomposeRequirement(content, configId);
  }

  private parseDecompositionResult(content: string): TaskDecomposition {
    const tasks: TaskDecomposition['tasks'] = [];
    const taskBlocks = content.split(/\n(?=\d+\.|Task\s*\d)/i);

    let totalHours = 0;

    for (const block of taskBlocks) {
      if (!block.trim()) continue;

      const titleMatch = block.match(/(?:^|\n)(?:Task\s*)?\d+[.):]\s*(.+)/i);
      const hoursMatch = block.match(/(\d+(?:\.\d+)?)\s*(?:hours?|h)/i);
      const priorityMatch = block.match(/priority:\s*(urgent|high|medium|low)/i);
      const descMatch = block.match(/description:\s*([\s\S]*?)(?=Dependencies?|$)/i);
      const depsMatch = block.match(/dependencies?:\s*([^\n]+)/i);

      if (titleMatch) {
        const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
        totalHours += hours;

        tasks.push({
          title: titleMatch[1].trim(),
          estimatedHours: hours,
          priority: (priorityMatch?.[1]?.toLowerCase() as TaskPriority) || TaskPriority.MEDIUM,
          dependencies: depsMatch ? depsMatch[1].split(',').map((d) => d.trim()) : [],
          description: descMatch?.[1]?.trim() || '',
        });
      }
    }

    return { tasks, totalEstimatedHours: totalHours };
  }

  private parseWorkloadEstimate(
    content: string,
  ): { estimatedHours: number; reasoning: string } {
    const hoursMatch = content.match(/hours?:\s*(\d+(?:\.\d+)?)/i);
    const reasoningMatch = content.match(/reasoning?:\s*([\s\S]*?)$/i);

    return {
      estimatedHours: hoursMatch ? parseFloat(hoursMatch[1]) : 0,
      reasoning: reasoningMatch?.[1]?.trim() || content,
    };
  }
}
