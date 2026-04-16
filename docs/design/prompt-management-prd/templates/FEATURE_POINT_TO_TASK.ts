export default {
  name: '功能点转任务生成',
  type: 'FEATURE_POINT_TO_TASK',
  description: '将功能点转换为开发任务列表',
  systemPrompt: `你是一个专业的任务分析师。你需要将功能点拆分为具体的开发任务。

要求：
1. 每个任务要具体、可执行
2. 合理评估工时
3. 标明优先级`,
  userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}请将以下功能点转换为开发任务列表。

功能点列表：
{{featurePoints}}

需求标题：{{requirementTitle}}
需求描述：{{requirementDescription}}

要求：
1. 每个任务包含：title（标题）、description（描述）、priority（优先级: 1高 2中 3低）、estimatedHours（预估工时）
2. 只返回JSON数组格式，不要其他内容

JSON格式：
[
  {
    "title": "任务标题",
    "description": "任务描述",
    "priority": 1,
    "estimatedHours": 2
  }
]`,
  temperature: 0.3,
  maxTokens: 2000,
  isActive: true,
};