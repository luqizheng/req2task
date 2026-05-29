import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { logger } from '../utils/logger.js';

export interface PromptTemplateInfo {
  id: string;
  name: string;
  description: string;
  template: string;
  inputVariables: string[];
  type: 'text' | 'chat';
}

export class PromptTemplateService {
  private templates: Map<string, PromptTemplateInfo> = new Map();

  constructor() {
    this.registerDefaultTemplates();
  }

  registerTemplate(template: PromptTemplateInfo): void {
    this.templates.set(template.id, template);
    logger.info({ templateId: template.id, templateName: template.name }, 'Prompt template registered');
  }

  getTemplate(id: string): PromptTemplateInfo | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): PromptTemplateInfo[] {
    return Array.from(this.templates.values());
  }

  deleteTemplate(id: string): boolean {
    const deleted = this.templates.delete(id);
    if (deleted) {
      logger.info({ templateId: id }, 'Prompt template deleted');
    }
    return deleted;
  }

  createLangChainTemplate(id: string): PromptTemplate | ChatPromptTemplate | null {
    const templateInfo = this.templates.get(id);
    if (!templateInfo) {
      logger.warn({ templateId: id }, 'Prompt template not found');
      return null;
    }

    if (templateInfo.type === 'chat') {
      return ChatPromptTemplate.fromTemplate(templateInfo.template);
    }

    return new PromptTemplate({
      template: templateInfo.template,
      inputVariables: templateInfo.inputVariables,
    });
  }

  async formatTemplate(id: string, variables: Record<string, string>): Promise<string | null> {
    const template = this.createLangChainTemplate(id);
    if (!template) {
      return null;
    }

    try {
      const result = await template.format(variables);
      return result;
    } catch (error) {
      logger.error({ error, templateId: id }, 'Failed to format template');
      return null;
    }
  }

  private registerDefaultTemplates(): void {
    const defaultTemplates: PromptTemplateInfo[] = [
      {
        id: 'system_default',
        name: '默认系统提示词',
        description: '通用 AI 助手系统提示词',
        template: `你是一个专业的 AI 助手。请遵循以下原则：
1. 仔细分析用户的问题，提供准确答案
2. 当问题不明确时，主动提出追问
3. 每次回复控制在合理长度，聚焦当前话题
4. 使用清晰、专业的语言`,
        inputVariables: [],
        type: 'text',
      },
      {
        id: 'summarization',
        name: '文本总结',
        description: '用于总结长文本的提示词模板',
        template: `请对以下文本进行总结：

{text}

要求：
1. 保持核心信息完整
2. 语言简洁明了
3. 不超过 {maxLength} 字`,
        inputVariables: ['text', 'maxLength'],
        type: 'text',
      },
      {
        id: 'translation',
        name: '翻译',
        description: '用于翻译文本的提示词模板',
        template: `请将以下文本翻译成 {targetLanguage}：

{text}

要求：
1. 保持原意不变
2. 语言自然流畅
3. 不要添加额外内容`,
        inputVariables: ['text', 'targetLanguage'],
        type: 'text',
      },
      {
        id: 'extraction',
        name: '信息提取',
        description: '用于从文本中提取信息的提示词模板',
        template: `从以下文本中提取信息：

文本：
{text}

请提取以下字段：
{fields}

以 JSON 格式输出结果，不要包含其他内容。`,
        inputVariables: ['text', 'fields'],
        type: 'text',
      },
      {
        id: 'code_review',
        name: '代码审查',
        description: '用于审查代码的提示词模板',
        template: `请审查以下代码：

语言：{language}
代码：
{code}

请从以下方面进行审查：
1. 代码质量和可读性
2. 潜在的 bug 和安全问题
3. 性能优化建议
4. 最佳实践遵循情况`,
        inputVariables: ['language', 'code'],
        type: 'text',
      },
      {
        id: 'requirement_analysis',
        name: '需求分析',
        description: '用于分析需求文档的提示词模板',
        template: `请分析以下需求描述：

{requirement}

请输出：
1. 需求概述
2. 功能点分解
3. 技术要点
4. 潜在风险和注意事项`,
        inputVariables: ['requirement'],
        type: 'text',
      },
      {
        id: 'writing_assistant',
        name: '写作助手',
        description: '用于辅助写作的提示词模板',
        template: `请帮我写一篇关于 {topic} 的文章。

要求：
- 字数：{wordCount} 字左右
- 风格：{style}
- 关键词：{keywords}
- 结构要求：{structure}`,
        inputVariables: ['topic', 'wordCount', 'style', 'keywords', 'structure'],
        type: 'text',
      },
      {
        id: 'debugging',
        name: '调试助手',
        description: '用于调试问题的提示词模板',
        template: `请帮助我调试以下问题：

问题描述：
{description}

相关代码：
{code}

错误信息：
{error}

请分析：
1. 可能的根本原因
2. 解决方案
3. 代码修复建议`,
        inputVariables: ['description', 'code', 'error'],
        type: 'text',
      },
    ];

    defaultTemplates.forEach((template) => {
      this.registerTemplate(template);
    });

    logger.info({ count: defaultTemplates.length }, 'Default prompt templates registered');
  }
}