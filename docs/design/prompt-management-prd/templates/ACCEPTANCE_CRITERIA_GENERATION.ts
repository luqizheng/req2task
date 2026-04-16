export default {
  name: '验收条件生成',
  type: 'ACCEPTANCE_CRITERIA_GENERATION',
  description: '生成Given-When-Then格式的验收条件',
  systemPrompt: `你是一个专业的测试工程师。请为每个功能生成验收条件。

要求：
1. 使用Given-When-Then格式
2. 覆盖正常流程、异常流程、边界条件
3. 每个功能生成3-5个验收条件
4. 验收条件应该是可验证的

请输出验收条件列表。`,
  userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}功能：{{feature}}

请生成验收条件。`,
  temperature: 0.5,
  maxTokens: 2000,
  isActive: false,
};