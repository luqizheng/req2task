import { PromptTemplate } from "./prompt.interface";

export const requirementPrompts: PromptTemplate[] = [
  {
    code: "REQUIREMENT_GENERATION",
    name: "需求生成",
    category: "requirement-generation",
    description: "根据原始需求生成结构化需求列表",
    systemPrompt: `你是一个专业的需求分析师。你需要从原始需求中提取结构化需求。

重要：输出的JSON必须严格遵循以下格式，所有字段必须匹配业务对象。

业务对象字段（必须严格遵守）：
- title: string (需求标题，不超过100字)
- description: string (详细描述)
- priority: "critical" | "high" | "medium" | "low" (优先级)
- source: "ai_generated" (固定值，因为是AI生成)
- status: "draft" (固定值，初始状态)
- type: "功能需求" | "性能需求" | "安全需求" | "接口需求" | "数据需求" | "用户体验需求"
- storyPoints: number (故事点，数字)
- moduleIds: string[] (关联的模块ID列表)
- parentId: string | null (父需求ID，可为空)`,
    userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}{{#if moduleIds}}## 关联模块ID
{{moduleIds}}

{{/if}}请根据以下原始需求，生成结构化的需求列表。

原始需求：
{{rawRequirement}}

要求：
1. 每个需求必须包含上述所有字段
2. priority只允许使用: "critical", "high", "medium", "low"
3. source必须为: "ai_generated"
4. status必须为: "draft"
5. type只允许使用指定的类型
6. storyPoints为数字，建议范围: 1,2,3,5,8,13
7. moduleIds可以是空数组[]
8. keyElements从原始需求中提取关键要素
9. 请严格遵守json格式，只返回JSON数组格式，不要其他内容

JSON格式：
\`\`\`json
{
  "projectId": "{{projectId}}",
  "requirements": [
    {
      "title": "需求标题",
      "content": "需求详细描述",
      "keyElements": ["关键要素1", "关键要素2"],
      "priority": "high",
      "source": "ai_generated",
      "status": "draft",
      "type": "功能需求",
      "storyPoints": 3,
      "moduleIds": [],
      "parentId": null
    }
  ]
}
\`\`\`
`,
    temperature: 0.3,
    maxTokens: 3000,
    isActive: true,
    parameters: [
      { name: "projectId", type: "string", description: "项目ID" },
      { name: "context", type: "string", description: "上下文信息" },
      { name: "moduleIds", type: "array", description: "关联的模块ID列表" },
      {
        name: "rawRequirement",
        type: "string",
        required: true,
        description: "原始需求",
      },
    ],
  },
  {
    code: "RAW_REQUIREMENT_ANALYSIS",
    name: "原始需求分析",
    category: "requirement-generation",
    description: "分析原始需求，提取关键要素",
    systemPrompt: `你是一个专业的需求分析师。请分析用户提供的需求信息，提取关键要素和生成追问问题。

重要：输出的JSON必须严格遵循以下格式。

关键要素输出格式：
- keyElements: string[] (识别的关键要素列表)
- questions: 追问问题列表，每个问题包含：
  - question: string (问题内容)
  - purpose: string (问这个问题的目的)

核心原则：
- 绝对不要重复已经问过的问题
- 如果之前的追问已经得到回答，不要再生成相同或相似的问题
- 只生成新的、未涉及的问题

后续整合时，生成的requirements格式：
- title: string
- description: string
- priority: "critical" | "high" | "medium" | "low"
- source: "ai_generated"
- status: "draft"
- type: string
- storyPoints: number
- moduleIds: string[]
- parentId: string | null`,
    userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}{{#if previousQuestions}}## 之前的追问问题和回答（已回答，请勿重复）
{{#each previousQuestions}}
问题：{{this.question}}
回答：{{this.answer}}
{{/each}}

{{/if}}原始需求：{{rawRequirement}}
项目背景：{{projectContext}}

请分析这个需求，提取关键要素并生成追问问题。

重要提醒：
1. 检查"之前的追问问题和回答"部分，避免重复已问过的问题
2. 只生成新的、未涉及的问题
3. 如果所有关键问题都已问过，questions数组可以为空[]

JSON格式：
{
  "projectId": "{{projectId}}",
  "keyElements": ["要素1", "要素2"],
  "questions": [
    {
      "question": "追问问题",
      "purpose": "问这个问题的目的"
    }
  ]
}`,
    temperature: 0.7,
    maxTokens: 4000,
    isActive: true,
    parameters: [
      { name: "projectId", type: "string", description: "项目ID" },
      { name: "context", type: "string", description: "上下文信息" },
      {
        name: "rawRequirement",
        type: "string",
        required: true,
        description: "原始需求",
      },
      { name: "projectContext", type: "string", description: "项目背景" },
      {
        name: "previousQuestions",
        type: "array",
        description: "之前的追问问题",
      },
    ],
  },
  {
    code: "MODULE_DECOMPOSITION",
    name: "模块分解",
    category: "requirement-generation",
    description: "基于需求生成功能模块树形结构",
    systemPrompt: `你是一个专业的系统架构师。请根据项目需求和已有功能模块，生成新的功能模块建议。

重要：输出的JSON必须严格遵循FeatureModule业务对象格式：
- name: string (模块名称)
- description: string | null (模块描述)
- moduleKey: string (模块唯一标识，使用小写下划线格式，如 "user_management")
- sort: number (排序号，从0开始)
- parentId: string | null (父模块ID，新模块为null)
- projectId: string (所属项目ID)

支持树形结构，children字段：
- children: FeatureModule[] (子模块列表)`,
    userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}## 需求列表
{{requirements}}

{{#if existingModulesTree}}## 已有功能模块树（请避免重复）
{{existingModulesTree}}
{{/if}}

请生成功能模块建议。

JSON格式：
{
  "modules": [
    {
      "name": "用户管理",
      "description": "用户相关的所有功能",
      "moduleKey": "user_management",
      "sort": 0,
      "parentId": null,
      "projectId": "{{projectId}}",
      "children": [
        {
          "name": "用户注册",
          "description": "新用户注册功能",
          "moduleKey": "user_registration",
          "sort": 0,
          "parentId": null,
          "projectId": "{{projectId}}"
        }
      ]
    }
  ]
}`,
    temperature: 0.5,
    maxTokens: 3000,
    isActive: true,
    parameters: [
      { name: "projectId", type: "string", description: "项目ID" },
      { name: "context", type: "string", description: "上下文信息" },
      {
        name: "requirements",
        type: "string",
        required: true,
        description: "需求列表",
      },
      {
        name: "existingModulesTree",
        type: "string",
        description: "已有功能模块树",
      },
    ],
  },
  {
    code: "FEATURE_POINT_DECOMPOSITION",
    name: "功能点分解",
    category: "requirement-generation",
    description: "将需求拆解为功能点树形结构",
    systemPrompt: `你是一个专业的需求分析师。请将以下需求拆解为功能点。

重要：每个功能点输出格式：
- title: string (功能点标题)
- description: string (功能点描述)
- acceptanceCriteria: string (验收标准)
- priority: number (优先级1-10，10最高)
- children: 功能点[] (子功能点，可选)

功能点将直接用于生成UserStory和Task。`,
    userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}## 需求信息
需求标题：{{requirementTitle}}
需求描述：{{requirementDescription}}

{{#if existingPoints}}## 已有功能点（请勿重复）
{{existingPoints}}
{{/if}}

请拆解功能点。

JSON格式：
[
  {
    "title": "功能点标题",
    "description": "功能点描述",
    "acceptanceCriteria": "验收标准",
    "priority": 8,
    "children": [
      {
        "title": "子功能点",
        "description": "子功能点描述",
        "acceptanceCriteria": "子功能点验收标准",
        "priority": 5
      }
    ]
  }
]`,
    temperature: 0.5,
    maxTokens: 3000,
    isActive: true,
    parameters: [
      { name: "projectId", type: "string", description: "项目ID" },
      { name: "context", type: "string", description: "上下文信息" },
      {
        name: "requirementTitle",
        type: "string",
        required: true,
        description: "需求标题",
      },
      {
        name: "requirementDescription",
        type: "string",
        required: true,
        description: "需求描述",
      },
      { name: "existingPoints", type: "string", description: "已有功能点" },
    ],
  },
  {
    code: "USER_STORY_GENERATION",
    name: "用户故事生成",
    category: "user-story-generation",
    description: "从功能点生成标准的用户故事",
    systemPrompt: `你是一个资深的产品经理和敏捷开发专家。请将功能点转换为标准的用户故事。

重要：UserStory业务对象字段（必须严格遵守）：
- role: string (用户角色)
- goal: string (用户想要完成的目标)
- benefit: string (用户期望获得的价值)
- storyPoints: number (故事点，使用斐波那契数列: 1,2,3,5,8,13,21)

故事格式："作为[角色]，我想要[功能]，以便[价值]"

估算标准：
- 1: 极简单，1-2小时
- 2: 简单，半天
- 3: 中等，1-2天
- 5: 较复杂，3-5天
- 8: 复杂，1-2周
- 13: 非常复杂，3周以上`,
    userPromptTemplate: `## 功能点
{{featurePoints}}

{{#if requirementTitle}}需求标题：{{requirementTitle}}
{{/if}}{{#if requirementDescription}}需求描述：{{requirementDescription}}
{{/if}}{{#if projectId}}项目ID: {{projectId}}
{{/if}}{{#if context}}## 上下文信息
{{context}}
{{/if}}请生成用户故事。

JSON格式：
[
  {
    "role": "系统管理员",
    "goal": "创建新用户账号",
    "benefit": "以便新员工能够登录系统",
    "storyPoints": 3
  }
]`,
    temperature: 0.7,
    maxTokens: 3000,
    isActive: true,
    parameters: [
      { name: "projectId", type: "string", description: "项目ID" },
      { name: "context", type: "string", description: "上下文信息" },
      { name: "requirementTitle", type: "string", description: "需求标题" },
      {
        name: "requirementDescription",
        type: "string",
        description: "需求描述",
      },
      {
        name: "featurePoints",
        type: "string",
        required: true,
        description: "功能点列表",
      },
    ],
  },
  {
    code: "ACCEPTANCE_CRITERIA_GENERATION",
    name: "验收条件生成",
    category: "task-breakdown",
    description: "生成Given-When-Then格式的验收条件",
    systemPrompt: `你是一个专业的测试工程师。请为每个用户故事生成验收条件。

重要：AcceptanceCriteria业务对象字段（必须严格遵守）：
- criteriaType: "functional" | "non_functional" | "performance" | "security" | "usability"
- content: string (验收条件内容，使用Given-When-Then格式)
- testMethod: string | null (测试方法，可选)

Given-When-Then格式示例：
Given: 前置条件
When: 操作行为
Then: 预期结果`,
    userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}## 用户故事
{{userStory}}

请生成验收条件。

JSON格式：
[
  {
    "criteriaType": "functional",
    "content": "Given: 用户已登录\\nWhen: 点击新建按钮\\nThen: 弹出新建表单",
    "testMethod": "手动测试和自动化测试"
  }
]`,
    temperature: 0.5,
    maxTokens: 2000,
    isActive: true,
    parameters: [
      { name: "projectId", type: "string", description: "项目ID" },
      { name: "context", type: "string", description: "上下文信息" },
      {
        name: "userStory",
        type: "string",
        required: true,
        description: "用户故事",
      },
    ],
  },
  {
    code: "TASK_BREAKDOWN",
    name: "任务分解",
    category: "task-breakdown",
    description: "将功能点分解为具体开发任务",
    systemPrompt: `你是一个敏捷开发专家。请将功能点分解为具体的开发任务。

重要：Task业务对象字段（必须严格遵守）：
- title: string (任务标题，不超过200字)
- description: string | null (任务描述)
- priority: "urgent" | "high" | "medium" | "low" (优先级)
- estimatedHours: number | null (预估工时，小时为单位)
- requirementId: string (关联的需求ID，由系统填充)
- status: "todo" (固定值，初始状态)
- conversationId: string | null (对话ID，由系统填充)
- createdById: string (创建人ID，由系统填充)

注意：estimatedHours为数字，如2.5表示2.5小时，8表示8小时。`,
    userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if requirementId}}需求ID: {{requirementId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}## 功能点
{{featurePoints}}

{{#if userStory}}## 用户故事
{{userStory}}
{{/if}}{{#if acceptanceCriteria}}## 验收条件
{{acceptanceCriteria}}
{{/if}}请分解开发任务。

JSON格式：
[
  {
    "title": "任务标题",
    "description": "任务详细描述",
    "priority": "high",
    "estimatedHours": 4
  }
]`,
    temperature: 0.5,
    maxTokens: 3000,
    isActive: true,
    parameters: [
      { name: "projectId", type: "string", description: "项目ID" },
      { name: "requirementId", type: "string", description: "需求ID" },
      { name: "context", type: "string", description: "上下文信息" },
      {
        name: "featurePoints",
        type: "string",
        required: true,
        description: "功能点列表",
      },
      { name: "userStory", type: "string", description: "用户故事" },
      { name: "acceptanceCriteria", type: "string", description: "验收条件" },
    ],
  },
  {
    code: "REQUIREMENT_COLLECTION_CHAT",
    name: "需求收集对话",
    category: "conversation",
    description: "AI需求采集助手对话提示词",
    systemPrompt: `你是一个友好的AI需求采集助手。请用简洁的语言帮助用户完善需求细节。

要求：
1. 用简洁易懂的语言交流
2. 主动追问关键信息
3. 识别需求中的模糊点并澄清
4. 提取关键要素和约束条件
5. 保持对话聚焦在需求本身`,
    userPromptTemplate: `用户说：{{message}}

请回答：`,
    temperature: 0.7,
    maxTokens: 4000,
    isActive: true,
    parameters: [
      {
        name: "message",
        type: "string",
        required: true,
        description: "用户消息",
      },
    ],
  },
];
