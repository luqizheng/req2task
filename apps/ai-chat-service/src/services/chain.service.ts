import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import { LLMChain, ConversationChain } from 'langchain/chains';
import { PromptTemplate, ChatPromptTemplate, MessagesPlaceholder, type BaseMessagePromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { HumanMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';
import { ConversationSummaryBufferMemory } from 'langchain/memory';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { logger } from '../utils/logger.js';

export interface ChainResult {
  output: string;
  intermediateSteps?: Record<string, string>;
}

export interface ChainConfig {
  modelName: string;
  provider: string;
  temperature?: number;
  maxTokens?: number;
}

export class ChainService {
  private defaultConfig: ChainConfig;

  constructor(config?: Partial<ChainConfig>) {
    this.defaultConfig = {
      modelName: 'gpt-4o-mini',
      provider: 'openai',
      temperature: 0.7,
      maxTokens: 2000,
      ...config,
    };
  }

  private createModel(config?: Partial<ChainConfig>): BaseChatModel {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const { modelName, provider, temperature, maxTokens } = mergedConfig;

    logger.debug({ modelName, provider }, 'Creating LLM model for chain');

    switch (provider.toLowerCase()) {
      case 'anthropic':
        return new ChatAnthropic({
          model: modelName,
          temperature: temperature,
          maxTokens: maxTokens,
        });
      case 'ollama':
        return new ChatOllama({
          model: modelName,
          temperature: temperature,
        });
      case 'openai':
      default:
        return new ChatOpenAI({
          model: modelName,
          temperature: temperature,
          maxTokens: maxTokens,
        });
    }
  }

  async runLLMChain(
    prompt: string,
    inputVariables: Record<string, string>,
    config?: Partial<ChainConfig>,
  ): Promise<ChainResult> {
    logger.debug({ promptLength: prompt.length, inputVariables }, 'Running LLMChain');

    const model = this.createModel(config);
    const template = new PromptTemplate({
      template: prompt,
      inputVariables: Object.keys(inputVariables),
    });

    const chain = new LLMChain({
      llm: model,
      prompt: template,
      outputKey: 'output',
    });

    const result = await chain.call(inputVariables);

    logger.debug({ outputLength: result.output?.length }, 'LLMChain completed');

    return {
      output: result.output as string,
    };
  }

  async runSequentialChain(
    steps: Array<{
      prompt: string;
      inputVariables: string[];
      outputKey: string;
    }>,
    initialInputs: Record<string, string>,
    config?: Partial<ChainConfig>,
  ): Promise<ChainResult> {
    logger.debug({ stepCount: steps.length, initialInputs }, 'Running SequentialChain');

    const model = this.createModel(config);
    const allChains: LLMChain[] = [];
    const outputKeys: string[] = [];

    for (const step of steps) {
      const template = new PromptTemplate({
        template: step.prompt,
        inputVariables: step.inputVariables,
      });

      const chain = new LLMChain({
        llm: model,
        prompt: template,
        outputKey: step.outputKey,
      });

      allChains.push(chain);
      outputKeys.push(step.outputKey);
    }

    let currentInputs = { ...initialInputs };
    const allResults: Record<string, string> = { ...initialInputs };

    for (let i = 0; i < allChains.length; i++) {
      const chain = allChains[i];
      const outputKey = outputKeys[i];
      const result = await chain.call(currentInputs);
      allResults[outputKey] = result[outputKey] as string;
      currentInputs = { ...currentInputs, ...result };
    }

    logger.debug({ outputKeys }, 'SequentialChain completed');

    return {
      output: allResults[outputKeys[outputKeys.length - 1]] as string,
      intermediateSteps: allResults,
    };
  }

  async runSimpleSequentialChain(
    prompts: string[],
    initialInput: string,
    config?: Partial<ChainConfig>,
  ): Promise<ChainResult> {
    logger.debug({ promptCount: prompts.length }, 'Running SimpleSequentialChain');

    const model = this.createModel(config);

    let currentInput = initialInput;

    for (const prompt of prompts) {
      const template = new PromptTemplate({
        template: prompt,
        inputVariables: ['input'],
      });

      const chain = new LLMChain({
        llm: model,
        prompt: template,
      });

      const result = await chain.call({ input: currentInput });
      currentInput = result.text as string;
    }

    logger.debug({ outputLength: currentInput.length }, 'SimpleSequentialChain completed');

    return {
      output: currentInput,
    };
  }

  async runConversationChain(
    messages: Array<{ role: string; content: string }>,
    systemPrompt?: string,
    config?: Partial<ChainConfig>,
  ): Promise<ChainResult> {
    logger.debug({ messageCount: messages.length, hasSystemPrompt: !!systemPrompt }, 'Running ConversationChain');

    const model = this.createModel(config);

    const promptMessages: Array<BaseMessage | BaseMessagePromptTemplate> = [];
    if (systemPrompt) {
      promptMessages.push(new SystemMessage(systemPrompt));
    }
    promptMessages.push(new MessagesPlaceholder('history'));
    promptMessages.push(new HumanMessage('{input}'));

    const chatPrompt = ChatPromptTemplate.fromMessages(promptMessages);

    const memory = new ConversationSummaryBufferMemory({
      llm: model,
      maxTokenLimit: 1000,
      returnMessages: true,
    });

    for (const message of messages.slice(0, -1)) {
      if (message.role === 'user') {
        await memory.chatHistory.addUserMessage(message.content);
      } else if (message.role === 'assistant') {
        await memory.chatHistory.addAIChatMessage(message.content);
      }
    }

    const chain = new ConversationChain({
      llm: model,
      memory,
      prompt: chatPrompt,
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chain.call({ input: lastMessage.content });

    logger.debug({ outputLength: result.response?.length }, 'ConversationChain completed');

    return {
      output: result.response as string,
    };
  }

  async runExtractionChain(
    text: string,
    schema: Record<string, string>,
    config?: Partial<ChainConfig>,
  ): Promise<ChainResult> {
    logger.debug({ textLength: text.length, fields: Object.keys(schema) }, 'Running ExtractionChain');

    const model = this.createModel(config);

    const fieldsDescription = Object.entries(schema)
      .map(([key, description]) => `- ${key}: ${description}`)
      .join('\n');

    const prompt = `
从以下文本中提取信息：

文本：
{text}

请提取以下字段：
${fieldsDescription}

以 JSON 格式输出结果，不要包含其他内容。
`;

    const template = new PromptTemplate({
      template: prompt,
      inputVariables: ['text'],
    });

    const chain = template.pipe(model).pipe(new StringOutputParser());
    const result = await chain.invoke({ text });

    logger.debug({ outputLength: result.length }, 'ExtractionChain completed');

    return {
      output: result,
    };
  }

  async runSummarizationChain(
    text: string,
    config?: Partial<ChainConfig>,
  ): Promise<ChainResult> {
    logger.debug({ textLength: text.length }, 'Running SummarizationChain');

    const model = this.createModel(config);

    const prompt = `
请对以下文本进行总结：

{text}

要求：
1. 保持核心信息完整
2. 语言简洁明了
3. 不超过 300 字
`;

    const template = new PromptTemplate({
      template: prompt,
      inputVariables: ['text'],
    });

    const chain = template.pipe(model).pipe(new StringOutputParser());
    const result = await chain.invoke({ text });

    logger.debug({ outputLength: result.length }, 'SummarizationChain completed');

    return {
      output: result,
    };
  }

  async runTranslationChain(
    text: string,
    targetLanguage: string = 'English',
    config?: Partial<ChainConfig>,
  ): Promise<ChainResult> {
    logger.debug({ textLength: text.length, targetLanguage }, 'Running TranslationChain');

    const model = this.createModel(config);

    const prompt = `
请将以下文本翻译成 ${targetLanguage}：

{text}

要求：
1. 保持原意不变
2. 语言自然流畅
3. 不要添加额外内容
`;

    const template = new PromptTemplate({
      template: prompt,
      inputVariables: ['text'],
    });

    const chain = template.pipe(model).pipe(new StringOutputParser());
    const result = await chain.invoke({ text });

    logger.debug({ outputLength: result.length }, 'TranslationChain completed');

    return {
      output: result,
    };
  }
}