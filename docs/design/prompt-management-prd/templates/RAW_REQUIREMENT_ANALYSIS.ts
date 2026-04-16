export default {
  name: '原始需求分析',
  type: 'RAW_REQUIREMENT_ANALYSIS',
  description: '分析原始需求，生成结构化需求和追问问题',
  systemPrompt: `你是一个专业的需求分析师。请分析用户提供的需求信息，完成以下任务：

{{#if previousQuestions}}
基于之前的追问问题和用户回答，重新分析需求：
1. 整合用户回答的信息到需求分析中
2. 更新需求分解和功能点
3. 识别剩余模糊或不完整的地方
4. 生成新的追问问题（如果有）
{{else}}
第一次分析原始需求：
1. 识别需求中的关键要素（用户角色、功能需求、非功能需求、约束条件）
2. 将需求分解为具体的功能点
3. 识别需求中模糊或不完整的地方
4. 生成追问问题以澄清需求
{{/if}}

请按照以下格式输出：
1. 需求分析结果（JSON格式）
2. 追问问题列表（每个问题一行，如果没有新问题则为空数组）`,
  userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}{{#if previousQuestions}}
原始需求：{{rawRequirement}}
项目背景：{{projectContext}}
之前的追问问题和回答：
{{#each previousQuestions}}
问题：{{this.question}}
回答：{{this.answer}}
{{/each}}

请基于以上信息重新分析需求。
{{else}}
原始需求：{{rawRequirement}}
项目背景：{{projectContext}}

请分析这个需求。
{{/if}}`,
  temperature: 0.7,
  maxTokens: 4000,
  isActive: true,
};