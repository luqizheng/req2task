import { PromptTemplate } from './prompt.interface';

export const requirementPrompts: PromptTemplate[] = [
  {
    code: 'REQUIREMENT_GENERATION',
    name: '需求生成',
    category: 'requirement-generation',
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
    parameters: [
      { name: 'projectId', type: 'string', description: '项目ID' },
      { name: 'context', type: 'string', description: '上下文信息' },
      { name: 'rawRequirement', type: 'string', required: true, description: '原始需求' },
      { name: 'conversation', type: 'string', description: '追问问答内容' },
    ],
  },
  {
    code: 'RAW_REQUIREMENT_ANALYSIS',
    name: '原始需求分析',
    category: 'requirement-generation',
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
    parameters: [
      { name: 'projectId', type: 'string', description: '项目ID' },
      { name: 'context', type: 'string', description: '上下文信息' },
      { name: 'rawRequirement', type: 'string', required: true, description: '原始需求' },
      { name: 'projectContext', type: 'string', description: '项目背景' },
      { name: 'previousQuestions', type: 'array', description: '之前的追问问答' },
    ],
  },
  {
    code: 'MODULE_DECOMPOSITION',
    name: '模块分解',
    category: 'requirement-generation',
    description: '基于需求和已有模块生成功能模块建议（树形结构）',
    systemPrompt: `你是一个专业的系统架构师。请根据项目需求和已有功能模块，生成新的功能模块建议。

要求：
1. 分析需求，识别核心业务模块和子模块
2. 已有模块以树形结构展示，分析其层级关系
3. 生成的模块也应采用树形结构（根模块+子模块）
4. 为每个模块生成名称、描述、优先级(1-10)
5. 输出JSON格式`,
    userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}## 需求列表
{{requirements}}

## 已有功能模块树（请避免重复）
{{existingModulesTree}}

## 要求
请生成{{count}}个根功能模块建议，确保不与已有模块重复。每个根模块可包含1-3个子模块。

请以JSON格式返回（树形结构）：
{
  "modules": [
    {
      "name": "根模块名称",
      "description": "根模块描述",
      "priority": 优先级,
      "children": [
        {
          "name": "子模块名称",
          "description": "子模块描述",
          "priority": 优先级
        }
      ]
    }
  ]
}`,
    temperature: 0.5,
    maxTokens: 3000,
    isActive: true,
    parameters: [
      { name: 'projectId', type: 'string', description: '项目ID' },
      { name: 'context', type: 'string', description: '上下文信息' },
      { name: 'requirements', type: 'string', required: true, description: '需求列表' },
      { name: 'existingModulesTree', type: 'string', description: '已有功能模块树' },
      { name: 'count', type: 'number', defaultValue: '3', description: '生成模块数量' },
    ],
  },
  {
    code: 'FEATURE_POINT_DECOMPOSITION',
    name: '功能点分解',
    category: 'requirement-generation',
    description: '将需求拆解为多个功能点（支持树状结构）',
    systemPrompt: `你是一个专业的需求分析师。请将以下需求拆解为多个功能点。

要求：
1. 每个功能点包含：标题、描述、验收标准、优先级(1-10)
2. 支持树状结构（父子层级）
3. 优先级10为最高
4. 不要生成与已有功能点重复的内容
5. 输出JSON格式`,
    userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}## 需求标题
{{requirementTitle}}

## 需求描述
{{requirementDescription}}

{{#if existingPoints}}## 已有功能点（请勿重复生成）
{{existingPoints}}
{{/if}}

请以JSON格式返回，格式如下：
[
  {
    "title": "功能点标题",
    "description": "功能点描述",
    "acceptanceCriteria": "验收标准",
    "priority": 优先级,
    "children": [
      {
        "title": "子功能点标题",
        "description": "子功能点描述",
        "acceptanceCriteria": "验收标准",
        "priority": 优先级
      }
    ]
  }
]`,
    temperature: 0.5,
    maxTokens: 3000,
    isActive: true,
    parameters: [
      { name: 'projectId', type: 'string', description: '项目ID' },
      { name: 'context', type: 'string', description: '上下文信息' },
      { name: 'requirementTitle', type: 'string', required: true, description: '需求标题' },
      { name: 'requirementDescription', type: 'string', required: true, description: '需求描述' },
      { name: 'existingPoints', type: 'string', description: '已有功能点' },
    ],
  },
  {
    code: 'PRD_GENERATION',
    name: 'PRD 文档生成',
    category: 'requirement-generation',
    description: '根据对话内容生成结构化的产品需求文档',
    systemPrompt: `你是一个专业的 PRD 文档生成助手。根据对话内容，生成结构化的产品需求文档。

文档格式要求：
1. 使用标准 Markdown 格式
2. 包含以下章节：概述、功能需求、非功能需求、用户故事、风险与假设
3. 用户故事使用 "作为...我想要...以便..." 格式
4. 功能需求按模块组织

输出纯 Markdown 内容，不要有其他解释。`,
    userPromptTemplate: `请根据以下对话内容生成 PRD 文档：

{{conversationText}}`,
    temperature: 0.5,
    maxTokens: 8000,
    isActive: true,
    parameters: [
      { name: 'conversationText', type: 'string', required: true, description: '对话内容' },
    ],
  },
  {
    code: 'REQUIREMENT_COLLECTION_CHAT',
    name: '需求收集对话',
    category: 'requirement-generation',
    description: 'AI 需求采集助手对话提示词，通过对话帮助用户完善需求细节',
    systemPrompt: `你是一个友好的AI助手。请用简洁的语言回答用户的问题。`,
    userPromptTemplate: `用户说：{{message}}

请回答：`,
    temperature: 0.7,
    maxTokens: 4000,
    isActive: true,
    parameters: [
      { name: 'message', type: 'string', required: true, description: '用户消息' },
    ],
  },
];