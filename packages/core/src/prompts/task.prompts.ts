import { PromptTemplate } from './prompt.interface';

export const taskPrompts: PromptTemplate[] = [
  {
    code: 'TASK_BREAKDOWN',
    name: '任务分解',
    category: 'task-breakdown',
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
    parameters: [
      { name: 'projectId', type: 'string', description: '项目ID' },
      { name: 'context', type: 'string', description: '上下文信息' },
      { name: 'modules', type: 'string', required: true, description: '功能模块列表' },
    ],
  },
  {
    code: 'FEATURE_POINT_TO_TASK',
    name: '功能点转任务生成',
    category: 'task-breakdown',
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
    parameters: [
      { name: 'projectId', type: 'string', description: '项目ID' },
      { name: 'context', type: 'string', description: '上下文信息' },
      { name: 'featurePoints', type: 'string', required: true, description: '功能点列表' },
      { name: 'requirementTitle', type: 'string', description: '需求标题' },
      { name: 'requirementDescription', type: 'string', description: '需求描述' },
    ],
  },
  {
    code: 'USER_STORY_GENERATION',
    name: '用户故事生成',
    category: 'user-story-generation',
    description: '生成标准的用户故事格式',
    systemPrompt: `你是一个资深的产品经理和敏捷开发专家，擅长将复杂需求转换为标准的用户故事格式。

你的核心职责：
1. 深入理解需求，识别关键角色和用户痛点
2. 将需求拆解为清晰、可执行的用户故事
3. 确保每个用户故事都有明确的价值主张
4. 准确估算故事点，反映实现复杂度
5. 保持故事的数量适中，避免过度拆分或合并

用户故事标准格式：
- 作为 [角色]，我想要 [功能]，以便 [价值]

故事点估算标准（斐波那契数列）：
- 1: 极简单，1-2小时可完成
- 2: 简单，半天可完成
- 3: 中等，1-2天可完成
- 5: 较复杂，3-5天可完成
- 8: 复杂，1-2周可完成
- 13: 非常复杂，3周以上可完成

请始终以 JSON 格式输出结果。`,
    userPromptTemplate: `## 原始需求
{{requirementText}}

{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}## 生成要求
1. 识别需求涉及的角色（最多3个不同角色）
2. 每个角色生成1-2个用户故事
3. 故事格式："作为[角色]，我想要[功能]，以便[价值]"
4. 估算故事点（斐波那契数列：1,2,3,5,8,13）
5. 保持用户故事简洁明确，避免技术术语
6. 每个用户故事应该独立可测试

## 输出格式
请输出JSON格式：
[
    { "role": "角色名称", "goal": "功能描述", "benefit": "价值描述", "story_points": 数字, "reasoning": "估算理由" }
]`,
    temperature: 0.7,
    maxTokens: 3000,
    isActive: true,
    parameters: [
      { name: 'projectId', type: 'string', description: '项目ID' },
      { name: 'context', type: 'string', description: '上下文信息' },
      { name: 'requirementText', type: 'string', required: true, description: '需求文本' },
    ],
  },
  {
    code: 'ACCEPTANCE_CRITERIA_GENERATION',
    name: '验收条件生成',
    category: 'task-breakdown',
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
    parameters: [
      { name: 'projectId', type: 'string', description: '项目ID' },
      { name: 'context', type: 'string', description: '上下文信息' },
      { name: 'feature', type: 'string', required: true, description: '功能描述' },
    ],
  },
];