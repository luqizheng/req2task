export default {
  name: '模块分解',
  type: 'MODULE_DECOMPOSITION',
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
};