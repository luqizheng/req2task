export default {
  name: '功能点分解',
  type: 'FEATURE_POINT_DECOMPOSITION',
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
};
