import { PromptCategory } from './prompt.interface';

export interface PromptCategoryConfig {
  code: PromptCategory;
  name: string;
  description: string;
}

export const PROMPT_CATEGORIES: Record<PromptCategory, PromptCategoryConfig> = {
  'requirement-generation': {
    code: 'requirement-generation',
    name: '需求生成',
    description: '用于 AI 生成结构化需求的提示词',
  },
  'task-breakdown': {
    code: 'task-breakdown',
    name: '任务分解',
    description: '用于将需求或功能模块分解为具体开发任务的提示词',
  },
  'requirement-review': {
    code: 'requirement-review',
    name: '需求评审',
    description: '用于 AI 辅助评审需求质量和完整性的提示词',
  },
  'user-story-generation': {
    code: 'user-story-generation',
    name: '用户故事生成',
    description: '用于将需求转换为标准用户故事格式的提示词',
  },
  'quality-assessment': {
    code: 'quality-assessment',
    name: '质量评估',
    description: '用于评估需求质量并给出改进建议的提示词',
  },
  'conversation': {
    code: 'conversation',
    name: '对话',
    description: '用于 AI 智能对话的提示词',
  },
  'custom': {
    code: 'custom',
    name: '自定义',
    description: '用户自定义的提示词',
  },
};

export const CATEGORY_LIST = Object.values(PROMPT_CATEGORIES);