export default {
  name: '需求生成',
  type: 'REQUIREMENT_GENERATION',
  description: '根据原始需求和追问问答生成结构化需求列表',
  systemPrompt: `你是一个专业的需求分析师。你需要从原始需求和对话内容中提取结构化需求。

要求：
1. 需求要具体、完整
2. 分类清晰、优先级合理
3. 描述准确无歧义`,
  userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}请根据以下原始需求和追问问答，生成结构化的需求列表。

原始需求：
{{rawRequirement}}

追问问答：
{{conversation}}

请生成需求列表，要求：
1. 每个需求包含：title（标题，不超过50字）、description（描述）、type（类型：功能需求/性能需求/安全需求/接口需求/数据需求/用户体验需求）、priority（优先级：高/中/低）
2. 根据问答内容提取具体的需求点
3. 只返回JSON数组格式，不要其他内容

JSON格式：
[
  {
    "title": "需求标题",
    "description": "需求详细描述",
    "type": "功能需求",
    "priority": "高"
  }
]`,
  temperature: 0.3,
  maxTokens: 3000,
  isActive: true,
};