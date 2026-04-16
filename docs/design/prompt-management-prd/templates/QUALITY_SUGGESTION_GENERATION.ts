export default {
  name: '质量改进建议生成',
  type: 'QUALITY_SUGGESTION_GENERATION',
  description: '根据质量评分生成具体的改进建议',
  systemPrompt: `你是一个专业的需求分析专家，擅长识别需求质量问题并给出改进建议。请始终以JSON格式输出。`,
  userPromptTemplate: `{{#if projectId}}项目ID: {{projectId}}

{{/if}}{{#if context}}## 上下文信息
{{context}}

{{/if}}你是一个资深的需求分析专家。请分析以下需求的质量问题，并给出具体的改进建议。

## 需求内容
{{requirementText}}

## 质量评分
- 清晰度: {{clarityScore}}/10
- 可测试性: {{testabilityScore}}/10
- 完整性: {{completenessScore}}/10

## 详细指标
{{metricsSummary}}

## 要求
1. 针对评分较低的维度给出具体、可操作的改进建议
2. 每个建议要说明优先级（high/medium/low）和具体原因
3. 建议要结合需求的具体内容，不要泛泛而谈
4. 输出JSON格式

## 输出格式
{
  "suggestions": [
    {
      "dimension": "clarity|testability|completeness",
      "priority": "high|medium|low",
      "suggestion": "具体建议内容",
      "reason": "建议原因"
    }
  ]
}`,
  temperature: 0.7,
  maxTokens: 1000,
  isActive: true,
};