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

重要规则：
1. estimatedHours为数字，如2.5表示2.5小时
2. description可以是null
3. status必须为"todo"
4. 只返回JSON数组格式，不要其他内容
5. 不要生成与已有任务重复的内容
6. 每个任务要具体、可执行、无重叠`,
    userPromptTemplate: `## 已有任务（不要重复生成）
{{existingTasks}}

{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if requirementId}}需求ID: {{requirementId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}## 功能点
{{featurePoints}}

{{#if userStory}}## 用户故事
{{userStory}}
{{/if}}{{#if acceptanceCriteria}}## 验收条件
{{acceptanceCriteria}}
{{/if}}请根据功能点生成新的开发任务，只生成不重复的任务。

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
      { name: 'existingTasks', type: 'string', description: '已有任务列表，用于避免重复生成' },
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

{{/if}}## 用户故事
{{userStory}}

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
      { name: 'userStory', type: 'string', required: true, description: '用户故事' },
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
