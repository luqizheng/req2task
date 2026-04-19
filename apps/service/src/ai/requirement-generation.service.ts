import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  LLMService,
  PromptService,
  ChromaVectorStore,
  LLMMessage,
  RawRequirement,
  QuestionAndAnswer,
} from '@req2task/core';
import { RawRequirementStatus, Priority } from '@req2task/dto';
import {
  GenerateRequirementResultDto,
  AnalyzeWithFollowUpResultDto,
  ChatCollectResultDto,
  RawRequirementResponseDto,
  QuestionAndAnswerDto,
} from '@req2task/dto';

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

  private toRawRequirementResponseDto(entity: RawRequirement): RawRequirementResponseDto {
    return {
      id: entity.id,
      collectionId: entity.collectionId || '',
      conversationId: entity.conversationId || undefined,
      content: entity.originalContent,
      source: entity.source || '',
      status: entity.status,
      questionAndAnswers: this.toQuestionAndAnswerDtos(entity.questionAndAnswers),
      keyElements: entity.keyElements || [],
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toQuestionAndAnswerDtos(
    questionAndAnswers: QuestionAndAnswer[] | null,
  ): QuestionAndAnswerDto[] {
    if (!questionAndAnswers) return [];
    return questionAndAnswers.map((qa) => ({
      id: qa.id,
      question: qa.question,
      answer: qa.answer,
      createdAt: qa.createdAt,
      answeredAt: qa.answeredAt,
    }));
  }

  async createRawRequirement(
    content: string,
    createdById: string,
    collectionId?: string,
  ): Promise<RawRequirementResponseDto> {
    const rawRequirement = this.rawRequirementRepository.create({
      originalContent: content,
      status: RawRequirementStatus.PENDING,
      createdById,
      collectionId: collectionId || null,
      questionAndAnswers: [],
      keyElements: [],
    });

    const saved = await this.rawRequirementRepository.save(rawRequirement);
    return this.toRawRequirementResponseDto(saved);
  }

  async analyzeWithFollowUp(
    rawRequirementId: string,
    newMessage: string,
    configId?: string,
  ): Promise<AnalyzeWithFollowUpResultDto> {
    const rawRequirement = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
    });

    if (!rawRequirement) {
      throw new BadRequestException('Raw requirement not found');
    }

    const systemPrompt = `You are an expert requirements analyst helping to collect and clarify user requirements.
Your role is to:
1. Understand and summarize the user's requirement
2. Extract key elements from the requirement
3. Generate follow-up questions if the requirement is incomplete or ambiguous
4. Help the user refine their requirements through conversation

Be concise and ask targeted questions to clarify requirements.`;

    const answeredQuestions = this.getAnsweredQuestionsText(rawRequirement.questionAndAnswers);
    const analysisPrompt = `Please analyze the following requirement and provide a structured response:

Original requirement: ${rawRequirement.originalContent}

${answeredQuestions}

New message from user: ${newMessage}

Provide your response in the following JSON format:
{
  "summary": "A brief summary of the requirement (1-2 sentences)",
  "keyElements": ["element1", "element2", "..."],
  "newQuestions": ["New question 1?", "New question 2?"]
}

Only generate questions if the requirement needs clarification on:
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

      const newQAs: QuestionAndAnswer[] = (parsed.newQuestions || []).map((q) => ({
        id: uuidv4(),
        question: q,
        answer: null,
        createdAt: new Date().toISOString(),
        answeredAt: null,
      }));

      const currentQAs = rawRequirement.questionAndAnswers || [];
      const allQAs = [...currentQAs, ...newQAs];

      await this.rawRequirementRepository.update(rawRequirementId, {
        questionAndAnswers: allQAs,
        keyElements: parsed.keyElements,
        generatedContent: parsed.summary,
        status: newQAs.length > 0
          ? RawRequirementStatus.PENDING
          : RawRequirementStatus.PROCESSING,
      });

      return {
        summary: parsed.summary,
        keyElements: parsed.keyElements,
        questionAndAnswers: this.toQuestionAndAnswerDtos(allQAs),
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
  ): Promise<ChatCollectResultDto> {
    const result = await this.analyzeWithFollowUp(rawRequirementId, userMessage, configId);

    return {
      assistantMessage: result.summary,
      questionAndAnswers: result.questionAndAnswers,
      isComplete: result.questionAndAnswers.length === 0 ||
        result.questionAndAnswers.every((qa) => qa.answer !== null),
    };
  }

  async answerQuestion(
    rawRequirementId: string,
    questionId: string,
    answer: string,
  ): Promise<RawRequirementResponseDto> {
    const rawRequirement = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
    });

    if (!rawRequirement) {
      throw new BadRequestException('Raw requirement not found');
    }

    const questionAndAnswers = rawRequirement.questionAndAnswers || [];
    const questionIndex = questionAndAnswers.findIndex((qa) => qa.id === questionId);

    if (questionIndex === -1) {
      throw new BadRequestException('Question not found');
    }

    questionAndAnswers[questionIndex] = {
      ...questionAndAnswers[questionIndex],
      answer,
      answeredAt: new Date().toISOString(),
    };

    await this.rawRequirementRepository.update(rawRequirementId, {
      questionAndAnswers,
    });

    const updated = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
    });

    return this.toRawRequirementResponseDto(updated!);
  }

  async removeQuestion(
    rawRequirementId: string,
    questionId: string,
  ): Promise<RawRequirementResponseDto> {
    const rawRequirement = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
    });

    if (!rawRequirement) {
      throw new BadRequestException('Raw requirement not found');
    }

    const questionAndAnswers = (rawRequirement.questionAndAnswers || [])
      .filter((qa) => qa.id !== questionId);

    await this.rawRequirementRepository.update(rawRequirementId, {
      questionAndAnswers,
    });

    const updated = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
    });

    return this.toRawRequirementResponseDto(updated!);
  }

  async *streamChatCollect(
    rawRequirementId: string,
    userMessage: string,
    configId?: string,
  ): AsyncGenerator<{ type: 'content' | 'metadata' | 'done'; content?: string; conversationId?: string; questionAndAnswers?: QuestionAndAnswerDto[] }> {
    const rawRequirement = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
    });

    if (!rawRequirement) {
      throw new BadRequestException('Raw requirement not found');
    }

    const systemPrompt = `You are an expert requirements analyst helping to collect and clarify user requirements.
Your role is to:
1. Understand and summarize the user's requirement
2. Extract key elements from the requirement
3. Generate follow-up questions if the requirement is incomplete or ambiguous
4. Help the user refine their requirements through conversation

Be concise and ask targeted questions to clarify requirements.`;

    const answeredQuestions = this.getAnsweredQuestionsText(rawRequirement.questionAndAnswers);
    const analysisPrompt = `Please analyze the following requirement and provide a structured response:

Original requirement: ${rawRequirement.originalContent}

${answeredQuestions}

New message from user: ${userMessage}

Provide your response in the following JSON format:
{
  "summary": "A brief summary of the requirement (1-2 sentences)",
  "keyElements": ["element1", "element2", "..."],
  "newQuestions": ["New question 1?", "New question 2?"]
}

Only generate questions if the requirement needs clarification on:
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
      let fullContent = '';
      let keyElements: string[] = [];

      for await (const chunk of this.llmService.generateStream(messages, configId, {
        temperature: 0.7,
        maxTokens: 2048,
      })) {
        if (chunk.content) {
          fullContent += chunk.content;
          yield { type: 'content', content: chunk.content };
        }
      }

      const parsed = this.parseAnalysisResponse(fullContent);
      keyElements = parsed.keyElements;

      const newQAs: QuestionAndAnswer[] = (parsed.newQuestions || []).map((q) => ({
        id: uuidv4(),
        question: q,
        answer: null,
        createdAt: new Date().toISOString(),
        answeredAt: null,
      }));

      const currentQAs = rawRequirement.questionAndAnswers || [];
      const allQAs = [...currentQAs, ...newQAs];

      await this.rawRequirementRepository.update(rawRequirementId, {
        questionAndAnswers: allQAs,
        keyElements,
        generatedContent: parsed.summary,
        status: newQAs.length > 0
          ? RawRequirementStatus.PENDING
          : RawRequirementStatus.PROCESSING,
      });

      yield {
        type: 'metadata',
        conversationId: rawRequirementId,
        questionAndAnswers: this.toQuestionAndAnswerDtos(allQAs),
      };
    } catch (error) {
      this.logger.error(
        `Failed to stream chat collect for ${rawRequirementId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async generateRequirement(
    rawRequirementId: string,
    configId?: string,
  ): Promise<GenerateRequirementResultDto> {
    const rawRequirement = await this.rawRequirementRepository.findOne({
      where: { id: rawRequirementId },
    });

    if (!rawRequirement) {
      throw new BadRequestException('Raw requirement not found');
    }

    const unansweredQuestions = (rawRequirement.questionAndAnswers || [])
      .filter((qa) => !qa.answer);

    if (unansweredQuestions.length > 0) {
      throw new BadRequestException(
        `还有 ${unansweredQuestions.length} 个追问未回答，请先完成所有追问`,
      );
    }

    try {
      await this.rawRequirementRepository.update(rawRequirementId, {
        status: RawRequirementStatus.PROCESSING,
      });

      const clarifiedContent = this.buildClarifiedContent(
        rawRequirement.originalContent,
        rawRequirement.questionAndAnswers,
      );

      const rendered = this.promptService.render('REQUIREMENT_GENERATION', {
        rawRequirement: clarifiedContent,
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

  async findAll(): Promise<RawRequirementResponseDto[]> {
    const rawRequirements = await this.rawRequirementRepository.find({
      order: { createdAt: 'DESC' },
    });
    return rawRequirements.map((r) => this.toRawRequirementResponseDto(r));
  }

  async findById(id: string): Promise<RawRequirementResponseDto | null> {
    const rawRequirement = await this.rawRequirementRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });
    return rawRequirement ? this.toRawRequirementResponseDto(rawRequirement) : null;
  }

  private getAnsweredQuestionsText(questionAndAnswers: QuestionAndAnswer[] | null): string {
    if (!questionAndAnswers || questionAndAnswers.length === 0) {
      return '';
    }

    const answered = questionAndAnswers.filter((qa) => qa.answer);
    if (answered.length === 0) {
      return '';
    }

    return 'Previous Q&A:\n' + answered
      .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
      .join('\n\n');
  }

  private buildClarifiedContent(
    originalContent: string,
    questionAndAnswers: QuestionAndAnswer[] | null,
  ): string {
    const answered = (questionAndAnswers || []).filter((qa) => qa.answer);

    if (answered.length === 0) {
      return originalContent;
    }

    const qaText = answered
      .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
      .join('\n\n');

    return `${originalContent}\n\n补充说明（通过追问获得）：\n${qaText}`;
  }

  private parseGeneratedContent(content: string): Omit<GenerateRequirementResultDto, 'id'> {
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
    newQuestions: string[];
  } {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || '',
          keyElements: Array.isArray(parsed.keyElements) ? parsed.keyElements : [],
          newQuestions: Array.isArray(parsed.newQuestions) ? parsed.newQuestions : [],
        };
      }
    } catch {
      this.logger.warn('Failed to parse analysis response as JSON, using fallback');
    }

    const summaryMatch = content.match(/summary:?\s*(.+?)(?=\n\n|keyElements|newQuestions|$)/is);
    const summary = summaryMatch?.[1]?.trim() || content.substring(0, 200);

    return {
      summary,
      keyElements: [],
      newQuestions: [],
    };
  }
}
