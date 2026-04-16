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
  LLMProviderType,
} from '@req2task/core';
import { LLMConfig } from '@req2task/core';
import {
  CreateLLMConfigDto,
  UpdateLLMConfigDto,
  ChatRequestDto,
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

  async createLLMConfig(createDto: CreateLLMConfigDto): Promise<LLMConfig> {
    if (createDto.isDefault) {
      await this.llmConfigRepository.update({ isDefault: true }, { isDefault: false });
    }

    const config = this.llmConfigRepository.create(createDto);
    return this.llmConfigRepository.save(config);
  }

  async findAllLLMConfigs(): Promise<LLMConfig[]> {
    return this.llmConfigRepository.find({
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findLLMConfig(id: string): Promise<LLMConfig> {
    return this.llmConfigRepository.findOneOrFail({ where: { id } });
  }

  async updateLLMConfig(id: string, updateDto: UpdateLLMConfigDto): Promise<LLMConfig> {
    if (updateDto.isDefault) {
      await this.llmConfigRepository.update({ isDefault: true }, { isDefault: false });
    }

    await this.llmConfigRepository.update(id, updateDto);
    return this.findLLMConfig(id);
  }

  async deleteLLMConfig(id: string): Promise<void> {
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
    const template = this.promptService.renderTemplate('requirement_generation', {
      input,
    });

    const messages: LLMMessage[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: template },
    ];

    const result = await this.llmService.generate(messages, configId);
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
    return this.promptService.getAllTemplates();
  }
}
