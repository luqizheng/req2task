export default {
  name: '任务分解',
  type: 'TASK_BREAKDOWN',
  description: '将模块分解为具体开发任务',
  systemPrompt: `你是一个敏捷开发专家。请根据功能模块，分解具体的开发任务。

要求：
1. 每个任务应该是可独立完成的
2. 估算任务的工作量（人天）
3. 识别任务之间的依赖关系
4. 确定任务的优先级

请以JSON格式输出任务列表。`,
  userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}功能模块：{{modules}}

请进行任务分解。`,
  temperature: 0.5,
  maxTokens: 3000,
  isActive: false,
};