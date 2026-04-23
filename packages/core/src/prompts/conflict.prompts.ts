import { PromptTemplate } from './prompt.interface';

export const conflictPrompts: PromptTemplate[] = [
  {
    code: 'CONFLICT_DETECTION',
    name: '冲突检测',
    category: 'requirement-review',
    description: '检测需求之间的冲突',
    systemPrompt: `你是一个专业的需求分析师。请分析以下需求并检测任何潜在的冲突。

对于每个潜在冲突，提供：
1. 冲突的需求
2. 冲突类型
3. 解决建议`,
    userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}需求：
{{requirements}}

请分析并检测冲突。`,
    temperature: 0.5,
    maxTokens: 3000,
    isActive: true,
    parameters: [
      { name: 'projectId', type: 'string', description: '项目ID' },
      { name: 'context', type: 'string', description: '上下文信息' },
      { name: 'requirements', type: 'string', required: true, description: '需求内容' },
    ],
  },
];