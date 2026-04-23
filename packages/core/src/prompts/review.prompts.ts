import { PromptTemplate } from './prompt.interface';

export const reviewPrompts: PromptTemplate[] = [
  {
    code: 'REQUIREMENT_REVIEW',
    name: '需求评审',
    category: 'requirement-review',
    description: 'AI 辅助评审需求完整性和质量',
    systemPrompt: `你是一个资深需求评审专家。请评审需求的完整性、可实现性和一致性。

评审维度：
1. 完整性：需求是否覆盖所有必要场景
2. 清晰度：需求描述是否明确无歧义
3. 可实现性：技术实现是否可行
4. 一致性：需求之间是否相互冲突

请输出评审结果和改进建议。`,
    userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}请评审以下需求：

{{requirementContent}}

评审要求：
1. 识别需求中的问题点
2. 提出具体的改进建议
3. 标注优先级（高/中/低）`,
    temperature: 0.5,
    maxTokens: 3000,
    isActive: true,
    parameters: [
      { name: 'projectId', type: 'string', description: '项目ID' },
      { name: 'context', type: 'string', description: '上下文信息' },
      { name: 'requirementContent', type: 'string', required: true, description: '需求内容' },
    ],
  },
];