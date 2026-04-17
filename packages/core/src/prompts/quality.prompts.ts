import { PromptTemplate } from './prompt.interface';

export const qualityPrompts: PromptTemplate[] = [
  {
    code: 'QUALITY_ASSESSMENT',
    name: '质量评估',
    category: 'quality-assessment',
    description: '评估需求质量并给出改进建议',
    systemPrompt: `你是一个专业的需求质量评审专家。请评估需求的质量，并给出改进建议。

评估维度：
1. 清晰度：需求描述是否明确、无歧义
2. 完整性：需求是否覆盖所有必要的场景
3. 可测试性：需求是否可以通过测试验证
4. 一致性：需求之间是否相互一致、无冲突

请输出评估结果和改进建议。`,
    userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}需求内容：{{requirements}}

请评估质量。`,
    temperature: 0.3,
    maxTokens: 2000,
    isActive: false,
    parameters: [
      { name: 'projectId', type: 'string', description: '项目ID' },
      { name: 'context', type: 'string', description: '上下文信息' },
      { name: 'requirements', type: 'string', required: true, description: '需求内容' },
    ],
  },
  {
    code: 'QUALITY_SUGGESTION_GENERATION',
    name: '质量改进建议生成',
    category: 'quality-assessment',
    description: '根据质量评分生成具体的改进建议',
    systemPrompt: `你是一个专业的需求分析专家，擅长识别需求质量问题并给出改进建议。请始终以JSON格式输出。`,
    userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}你是一个资深的需求分析专家。请分析以下需求的质量问题，并给出具体的改进建议。

## 需求内容
{{requirementText}}

## 质量评分
- 清晰度: {{clarityScore}}/10
- 可测试性: {{testabilityScore}}/10
- 完整性: {{completenessScore}}/10

## 详细指标
{{metricsSummary}}

## 要求
1. 针对评分较低的维度给出具体、可操作的改进建议
2. 每个建议要说明优先级（high/medium/low）和具体原因
3. 建议要结合需求的具体内容，不要泛泛而谈
4. 输出JSON格式

## 输出格式
{
  "suggestions": [
    {
      "dimension": "clarity|testability|completeness",
      "priority": "high|medium|low",
      "suggestion": "具体建议内容",
      "reason": "建议原因"
    }
  ]
}`,
    temperature: 0.7,
    maxTokens: 1000,
    isActive: true,
    parameters: [
      { name: 'projectId', type: 'string', description: '项目ID' },
      { name: 'context', type: 'string', description: '上下文信息' },
      { name: 'requirementText', type: 'string', required: true, description: '需求文本' },
      { name: 'clarityScore', type: 'number', required: true, description: '清晰度评分' },
      { name: 'testabilityScore', type: 'number', required: true, description: '可测试性评分' },
      { name: 'completenessScore', type: 'number', required: true, description: '完整性评分' },
      { name: 'metricsSummary', type: 'string', description: '详细指标摘要' },
    ],
  },
];