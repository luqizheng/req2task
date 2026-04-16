export default {
  name: '质量评估',
  type: 'QUALITY_ASSESSMENT',
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
};