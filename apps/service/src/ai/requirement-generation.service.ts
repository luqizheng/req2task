import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LLMService,
  PromptService,
  ChromaVectorStore,
  LLMMessage,
} from '@req2task/core';
import { RawRequirement, ChatMessage } from '@req2task/core';
import { RawRequirementStatus, Priority } from '@req2task/dto';

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

export interface AnalyzeWithFollowUpResult {
  summary: string;
  keyElements: string[];
  followUpQuestions: string[];
  sessionHistory: ChatMessage[];
}

@Injectable()
export class RequirementGenerationService {
  private readonly logger = new Logger(RequirementGenerationService.name);

  constructor(
    @InjectRepository(RawRequirement)
    private rawRequirementRepository: Repository<RawRequirement>,
    private llmService: LLMService,
    private promptService: PromptService,
    private vectorStore: ChromaVectorStore,
  ) {}

  async createRawRequirement(
    content: string,
    createdById: string,
    collectionId?: string,
  ): Promise<RawRequirement> {
    const rawRequirement = this.rawRequirementRepository.create({
      originalContent: content,
      status: RawRequirementStatus.PENDING,
      createdById,
      collectionId: collectionId || null,
      sessionHistory: [],
      followUpQuestions: [],
      keyElements: [],
    });

    return this.rawRequirementRepository.save(rawRequirement);
  }

  async analyzeWithFollowUp(
    rawRequirementId: string,
    newMessage: string,
    configId?: string,
  ): Promise<AnalyzeWithFollowUpResult> {
    const rawRequirement = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
    });

    if (!rawRequirement) {
      throw new BadRequestException('Raw requirement not found');
    }

    const sessionHistory = rawRequirement.sessionHistory || [];
    sessionHistory.push({
      role: 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
    });

    const systemPrompt = `You are an expert requirements analyst helping to collect and clarify user requirements.
Your role is to:
1. Understand and summarize the user's requirement
2. Extract key elements from the requirement
3. Generate follow-up questions if the requirement is incomplete or ambiguous
4. Help the user refine their requirements through conversation

Be concise and ask targeted questions to clarify requirements.`;

    const conversationContext = sessionHistory
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const analysisPrompt = `Please analyze the following requirement and provide a structured response:

${conversationContext}

Provide your response in the following JSON format:
{
  "summary": "A brief summary of the requirement (1-2 sentences)",
  "keyElements": ["element1", "element2", "..."],
  "followUpQuestions": ["Question 1?", "Question 2?", "..."]
}

Only generate follow-up questions if the requirement needs clarification on:
- Missing details or specifications
- Ambiguous terms or requirements
- User roles or stakeholders
- Acceptance criteria
- Edge cases or error handling`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: analysisPrompt },
    ];

    try {
      const response = await this.llmService.chatWithConfig(messages, configId, {
        temperature: 0.7,
        maxTokens: 2048,
      });

      const parsed = this.parseAnalysisResponse(response.content);

      sessionHistory.push({
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
      });

      await this.rawRequirementRepository.update(rawRequirementId, {
        sessionHistory,
        followUpQuestions: parsed.followUpQuestions,
        keyElements: parsed.keyElements,
        generatedContent: parsed.summary,
        status: parsed.followUpQuestions.length > 0 
          ? RawRequirementStatus.PENDING 
          : RawRequirementStatus.PROCESSING,
      });

      return {
        summary: parsed.summary,
        keyElements: parsed.keyElements,
        followUpQuestions: parsed.followUpQuestions,
        sessionHistory,
      };
    } catch (error) {
      this.logger.error(
        `Failed to analyze requirement ${rawRequirementId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async chatCollect(
    rawRequirementId: string,
    userMessage: string,
    configId?: string,
  ): Promise<{
    assistantMessage: string;
    followUpQuestions: string[];
    isComplete: boolean;
  }> {
    const result = await this.analyzeWithFollowUp(rawRequirementId, userMessage, configId);

    const lastAssistantMessage = result.sessionHistory[result.sessionHistory.length - 1];

    return {
      assistantMessage: lastAssistantMessage?.content || '',
      followUpQuestions: result.followUpQuestions,
      isComplete: result.followUpQuestions.length === 0,
    };
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

      const rendered = this.promptService.render('REQUIREMENT_GENERATION', {
        rawRequirement: rawRequirement.originalContent,
        conversation: '',
      });

      const messages: LLMMessage[] = [
        { role: 'system', content: rendered.systemPrompt },
        { role: 'user', content: rendered.userPrompt },
      ];

      const response = await this.llmService.chatWithConfig(messages, configId, {
        temperature: rendered.temperature,
        maxTokens: rendered.maxTokens,
      });

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
            type: 'raw_requirement',
          },
        },
        {
          id: `${rawRequirementId}-generated`,
          content: response.content,
          metadata: {
            type: 'generated_requirement',
          },
        },
      ]);

      return {
        id: rawRequirementId,
        ...parsed,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate requirement ${rawRequirementId}`,
        error instanceof Error ? error.stack : String(error),
      );
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
    const rendered = this.promptService.render('USER_STORY_GENERATION', {
      requirementText: requirementContent,
    });

    const messages: LLMMessage[] = [
      { role: 'system', content: rendered.systemPrompt },
      { role: 'user', content: rendered.userPrompt },
    ];

    const response = await this.llmService.chatWithConfig(messages, configId, {
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });
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

  async findAll(): Promise<RawRequirement[]> {
    return this.rawRequirementRepository.find({
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

  private parseAnalysisResponse(content: string): {
    summary: string;
    keyElements: string[];
    followUpQuestions: string[];
  } {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || '',
          keyElements: Array.isArray(parsed.keyElements) ? parsed.keyElements : [],
          followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions : [],
        };
      }
    } catch {
      this.logger.warn('Failed to parse analysis response as JSON, using fallback');
    }

    const summaryMatch = content.match(/summary:?\s*(.+?)(?=\n\n|keyElements|followUpQuestions|$)/is);
    const summary = summaryMatch?.[1]?.trim() || content.substring(0, 200);

    return {
      summary,
      keyElements: [],
      followUpQuestions: [],
    };
  }
}
