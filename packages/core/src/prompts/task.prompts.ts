import { PromptTemplate } from './prompt.interface';

export const taskPrompts: PromptTemplate[] = [
  {
    code: 'TASK_BREAKDOWN',
    name: '任务分解',
    category: 'task-breakdown',
    description: '将功能点分解为具体开发任务',
    systemPrompt: `你是一个敏捷开发专家。请将功能点分解为具体的开发任务。

重要：Task业务对象字段（必须严格遵守）：
- title: string (任务标题，不超过200字)
- description: string | null (任务描述，可为null)
- priority: "urgent" | "high" | "medium" | "low" (优先级)
- estimatedHours: number | null (预估工时，小时为单位，如8.5)
- status: "todo" (固定值，初始状态)
- conversationId: string | null (对话ID，由系统填充)

注意：
1. estimatedHours为数字，如2.5表示2.5小时
2. description可以是null
3. status必须为"todo"
4. 只返回JSON数组格式，不要其他内容`,
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
    "estimatedHours": 4,
    "status": "todo"
  }
]`,
    temperature: 0.5,
    maxTokens: 3000,
    isActive: true,
    parameters: [
      { name: 'projectId', type: 'string', description: '项目ID' },
      { name: 'requirementId', type: 'string', description: '需求ID' },
      { name: 'context', type: 'string', description: '上下文信息' },
      { name: 'featurePoints', type: 'string', required: true, description: '功能点列表' },
      { name: 'userStory', type: 'string', description: '用户故事' },
      { name: 'acceptanceCriteria', type: 'string', description: '验收条件' },
    ],
  },
  {
    code: 'FEATURE_POINT_TO_TASK',
    name: '功能点转任务生成',
    category: 'task-breakdown',
    description: '将功能点转换为开发任务列表',
    systemPrompt: `你是一个专业的任务分析师。你需要将功能点拆分为具体的开发任务。

重要：Task业务对象字段（必须严格遵守）：
- title: string (任务标题，不超过200字)
- description: string | null (任务详细描述)
- priority: "urgent" | "high" | "medium" | "low" (优先级)
- estimatedHours: number | null (预估工时，小时为单位)
- status: "todo" (固定值)

要求：
1. 每个任务要具体、可执行
2. 合理评估工时（数字类型，如4, 8, 16）
3. 只返回JSON数组格式`,
    userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if requirementId}}需求ID: {{requirementId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}请将以下功能点转换为开发任务列表。

功能点列表：
{{featurePoints}}

需求标题：{{requirementTitle}}
需求描述：{{requirementDescription}}

JSON格式：
[
  {
    "title": "任务标题",
    "description": "任务描述",
    "priority": "high",
    "estimatedHours": 2,
    "status": "todo"
  }
]`,
    temperature: 0.3,
    maxTokens: 2000,
    isActive: true,
    parameters: [
      { name: 'projectId', type: 'string', description: '项目ID' },
      { name: 'requirementId', type: 'string', description: '需求ID' },
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

重要：UserStory业务对象字段（必须严格遵守）：
- role: string (用户角色，如"系统管理员"、"普通用户"）
- goal: string (用户想要完成的目标，如"创建新用户账号"）
- benefit: string (用户期望获得的价值，如"以便新员工能够登录系统"）
- storyPoints: number (故事点，使用斐波那契数列：1,2,3,5,8,13,21)

用户故事标准格式：
"作为 [角色]，我想要 [功能]，以便 [价值]"

故事点估算标准：
- 1: 极简单，1-2小时可完成
- 2: 简单，半天可完成
- 3: 中等，1-2天可完成
- 5: 较复杂，3-5天可完成
- 8: 复杂，1-2周可完成
- 13: 非常复杂，3周以上可完成`,
    userPromptTemplate: `## 原始需求
{{requirementText}}

{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}## 生成要求
1. 识别需求涉及的角色（最多3个不同角色）
2. 每个角色生成1-2个用户故事
3. story_points必须是数字：1, 2, 3, 5, 8, 13, 21
4. 保持用户故事简洁明确，避免技术术语

JSON格式：
[
    { "role": "角色名称", "goal": "功能描述", "benefit": "价值描述", "storyPoints": 3 }
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

重要：AcceptanceCriteria业务对象字段（必须严格遵守）：
- criteriaType: "functional" | "non_functional" | "performance" | "security" | "usability" (验收条件类型)
- content: string (验收条件内容，使用Given-When-Then格式)
- testMethod: string | null (测试方法，可为null)

Given-When-Then格式要求：
Given: 前置条件（用户状态、系统状态）
When: 操作行为（用户执行的动作）
Then: 预期结果（系统应该返回的结果）

要求：
1. 覆盖正常流程、异常流程、边界条件
2. 每个功能生成3-5个验收条件
3. 验收条件应该是可验证的
4. 只返回JSON数组格式`,
    userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}功能：{{feature}}

请生成验收条件。

JSON格式：
[
  {
    "criteriaType": "functional",
    "content": "Given: 用户已登录系统\\nWhen: 点击新建按钮\\nThen: 弹出新建表单",
    "testMethod": "手动测试"
  },
  {
    "criteriaType": "performance",
    "content": "Given: 系统正常运行\\nWhen: 执行搜索操作\\nThen: 响应时间不超过3秒",
    "testMethod": "性能测试"
  }
]`,
    temperature: 0.5,
    maxTokens: 2000,
    isActive: true,
    parameters: [
      { name: 'projectId', type: 'string', description: '项目ID' },
      { name: 'context', type: 'string', description: '上下文信息' },
      { name: 'feature', type: 'string', required: true, description: '功能描述' },
    ],
  },
  {
    code: 'MODULE_DECOMPOSITION',
    name: '模块分解',
    category: 'requirement-generation',
    description: '基于需求和已有模块生成功能模块建议（树形结构）',
    systemPrompt: `你是一个专业的系统架构师。请根据项目需求和已有功能模块，生成新的功能模块建议。

重要：FeatureModule业务对象字段（必须严格遵守）：
- name: string (模块名称)
- description: string | null (模块描述，可为null)
- moduleKey: string (模块唯一标识，使用小写下划线格式，如 "user_management")
- sort: number (排序号，从0开始)
- parentId: string | null (父模块ID，新模块为null)
- projectId: string (所属项目ID)
- children: FeatureModule[] | null (子模块列表)

要求：
1. 分析需求，识别核心业务模块和子模块
2. 已有模块以树形结构展示，分析其层级关系
3. 生成的模块也应采用树形结构
4. 为每个模块生成name、description、moduleKey、sort
5. 只返回JSON格式`,
    userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}## 需求列表
{{requirements}}

{{#if existingModulesTree}}## 已有功能模块树（请避免重复）
{{existingModulesTree}}
{{/if}}## 要求
请生成{{count}}个根功能模块建议，确保不与已有模块重复。每个根模块可包含1-3个子模块。

JSON格式（树形结构）：
{
  "modules": [
    {
      "name": "根模块名称",
      "description": "根模块描述",
      "moduleKey": "module_name",
      "sort": 0,
      "parentId": null,
      "projectId": "{{projectId}}",
      "children": [
        {
          "name": "子模块名称",
          "description": "子模块描述",
          "moduleKey": "sub_module_name",
          "sort": 0,
          "parentId": null,
          "projectId": "{{projectId}}",
          "children": null
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
];
