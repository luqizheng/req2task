import { PromptTemplate } from './prompt.interface';

export const conversationPrompts: PromptTemplate[] = [
  {
    code: 'INTELLIGENT_FOLLOW_UP',
    name: '智能追问',
    category: 'conversation',
    description: '分析用户回答，生成精准追问问题',
    systemPrompt: `你是一个专业的需求分析师。你的任务是根据用户已经提供的信息，分析其中的不完整或模糊之处，生成追问问题。

要求：
1. 每次只生成 1-2 个最关键的追问问题
2. 问题要具体、可回答
3. 优先追问影响范围最大、最核心的问题
4. 如果信息已经足够充分，返回空数组`,
    userPromptTemplate: `原始需求：
{{rawRequirement}}

已收集的需求信息：
{{collectedInfo}}

已完成的追问：
{{previousQuestions}}

请分析以上信息，生成追问问题（最多2个）。
JSON格式：
{
  "questions": [
    {
      "question": "追问问题",
      "reason": "为什么问这个问题",
      "targetAspect": "目标方面"
    }
  ],
  "isComplete": false
}`,
    temperature: 0.7,
    maxTokens: 2000,
    isActive: true,
    parameters: [
      { name: 'rawRequirement', type: 'string', required: true, description: '原始需求' },
      { name: 'collectedInfo', type: 'string', description: '已收集的信息' },
      { name: 'previousQuestions', type: 'string', description: '已完成的追问' },
    ],
  },
  {
    code: 'MULTI_REQUIREMENT_EXTRACTION',
    name: '多需求识别',
    category: 'conversation',
    description: '从对话中识别多个独立的原始需求',
    systemPrompt: `你是一个专业的需求分析师。你的任务是从对话内容中识别出多个独立的原始需求。

要求：
1. 将用户的原始需求拆分为多个独立的需求点
2. 每个需求应该是完整的、可独立实现的
3. 标注每个需求的主要类型（功能/性能/安全/接口/数据/体验）
4. 识别需求之间的依赖关系
5. 输出 JSON 格式数组`,
    userPromptTemplate: `对话内容：
{{conversationText}}

原始需求概要：
{{rawRequirementSummary}}

请识别所有独立的原始需求。
JSON格式：
{
  "requirements": [
    {
      "content": "需求内容",
      "type": "功能需求|性能需求|安全需求|接口需求|数据需求|用户体验需求",
      "priority": "高|中|低",
      "dependencies": ["相关需求ID"],
      "keywords": ["关键词1", "关键词2"]
    }
  ]
}`,
    temperature: 0.5,
    maxTokens: 3000,
    isActive: true,
    parameters: [
      { name: 'conversationText', type: 'string', required: true, description: '对话内容' },
      { name: 'rawRequirementSummary', type: 'string', description: '原始需求概要' },
    ],
  },
  {
    code: 'CONVERSATION_SUMMARY',
    name: '对话摘要',
    category: 'conversation',
    description: '生成对话摘要，用于后续需求分析',
    systemPrompt: `你是一个专业的需求分析师。请根据对话内容生成简洁的摘要。`,
    userPromptTemplate: `对话内容：
{{conversationText}}

请生成一段不超过200字的摘要，包含：
1. 需求的核心内容
2. 已澄清的关键点
3. 仍需关注的模糊点`,
    temperature: 0.3,
    maxTokens: 1000,
    isActive: true,
    parameters: [
      { name: 'conversationText', type: 'string', required: true, description: '对话内容' },
    ],
  },
  {
    code: 'AI_CHAT_RESPONSE',
    name: 'AI对话回复',
    category: 'conversation',
    description: 'AI需求采集助手对话',
    systemPrompt: `你是一个友好的AI需求分析师助手。请用简洁、专业的语言回答用户的问题。`,
    userPromptTemplate: `用户说：{{message}}

请回答：`,
    temperature: 0.7,
    maxTokens: 2000,
    isActive: true,
    parameters: [
      { name: 'message', type: 'string', required: true, description: '用户消息' },
    ],
  },
];
