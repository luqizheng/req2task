import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LLMService,
  PromptService,
  ChromaVectorStore,
  VectorDocument,
  SearchResult,
  LLMMessage,
} from '@req2task/core';
import { LLMConfig } from '@req2task/core';
import {
  CreateLLMConfigDto,
  UpdateLLMConfigDto,
  ChatRequestDto,
  LLMConfigResponseDto,
} from '@req2task/dto';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(LLMConfig)
    private llmConfigRepository: Repository<LLMConfig>,
    private llmService: LLMService,
    private promptService: PromptService,
    private vectorStore: ChromaVectorStore,
  ) {}

  async createLLMConfig(createDto: CreateLLMConfigDto): Promise<LLMConfigResponseDto> {
    if (createDto.isDefault) {
      await this.llmConfigRepository.update({ isDefault: true }, { isDefault: false });
    }

    const config = this.llmConfigRepository.create(createDto);
    const saved = await this.llmConfigRepository.save(config);
    return this.toResponseDto(saved);
  }

  async findAllLLMConfigs(): Promise<LLMConfigResponseDto[]> {
    const configs = await this.llmConfigRepository.find({
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
    return configs.map(c => this.toResponseDto(c));
  }

  async findLLMConfig(id: string): Promise<LLMConfigResponseDto> {
    const config = await this.llmConfigRepository.findOneOrFail({ where: { id } });
    return this.toResponseDto(config);
  }

  async updateLLMConfig(id: string, updateDto: UpdateLLMConfigDto): Promise<LLMConfigResponseDto> {
    if (updateDto.isDefault) {
      const oldDefault = await this.llmConfigRepository.findOne({ where: { isDefault: true } });
      if (oldDefault && oldDefault.id !== id) {
        await this.llmConfigRepository.update({ isDefault: true }, { isDefault: false });
        await this.llmService.invalidateCache(oldDefault.id);
      }
    }

    await this.llmConfigRepository.update(id, updateDto);
    await this.llmService.invalidateCache(id);
    return this.findLLMConfig(id);
  }

  private toResponseDto(config: LLMConfig): LLMConfigResponseDto {
    return {
      id: config.id,
      name: config.name,
      provider: config.provider,
      modelName: config.modelName,
      baseUrl: config.baseUrl,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      topP: config.topP,
      isActive: config.isActive,
      isDefault: config.isDefault,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      apiKey: config.apiKey ? '********' : undefined,
    };
  }

  async deleteLLMConfig(id: string): Promise<void> {
    await this.llmService.invalidateCache(id);
    await this.llmConfigRepository.delete(id);
  }

  async chat(request: ChatRequestDto): Promise<{ content: string }> {
    const messages: LLMMessage[] = [
      { role: 'user', content: request.message },
    ];

    const result = await this.llmService.chat(messages, request.configId);
    return { content: result.content };
  }

  async generateRequirement(
    input: string,
    configId?: string,
  ): Promise<{ content: string }> {
    const rendered = this.promptService.render('REQUIREMENT_GENERATION', {
      rawRequirement: input,
      conversation: '',
    });

    const messages: LLMMessage[] = [
      { role: 'system', content: rendered.systemPrompt },
      { role: 'user', content: rendered.userPrompt },
    ];

    const result = await this.llmService.chatWithConfig(messages, configId, {
      temperature: rendered.temperature,
      maxTokens: rendered.maxTokens,
    });
    return { content: result.content };
  }

  async searchVectorStore(query: string, limit: number = 5): Promise<SearchResult[]> {
    return this.vectorStore.search(query, limit);
  }

  async addToVectorStore(
    documents: VectorDocument[],
  ): Promise<void> {
    await this.vectorStore.add(documents);
  }

  async getPromptTemplates() {
    return this.promptService.getAll();
  }

  async testLLMConfig(configId: string, testMessage?: string): Promise<{
    success: boolean;
    content: string;
    configId: string;
    latencyMs?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    const message = testMessage || '请回复"配置测试成功"以确认连接正常。';

    try {
      const messages: LLMMessage[] = [
        { role: 'user', content: message },
      ];

      const result = await this.llmService.chatWithConfig(messages, configId);
      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        content: result.content,
        configId,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        content: '',
        configId,
        latencyMs,
        error: error instanceof Error ? error.message : '测试失败',
      };
    }
  }
}
