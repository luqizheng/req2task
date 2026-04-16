# 提示词管理模块 PRD

## 概述

提示词管理模块提供统一的提示词（Prompt）模板管理，通过源码配置方式管理所有提示词，支持参数化配置和分类管理，为 AI 生成功能提供可维护、可复用的提示词资源。

## 核心需求

### 1. 提示词源码管理
- 提示词以 TypeScript 配置对象形式管理
- 集中存放于 `packages/core/src/prompts/` 目录
- 支持分类组织

### 2. 参数化提示词
- 支持变量占位符 `{{variable}}`
- 参数类型定义
- 默认值配置

### 3. 提示词使用
- 通过 PromptService 调用
- 与 LLM 配置关联

## 文件结构

```
packages/core/src/prompts/
├── index.ts                    # 统一导出
├── prompt.interface.ts         # 类型定义
├── requirement.prompts.ts      # 需求相关提示词
├── task.prompts.ts             # 任务相关提示词
├── search.prompts.ts           # 搜索相关提示词
└── review.prompts.ts          # 评审相关提示词
```

## 类型定义

```typescript
// packages/core/src/prompts/prompt.interface.ts

export interface PromptParameter {
  name: string;           // 参数名
  type: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;      // 是否必填
  defaultValue?: string;   // 默认值
  description?: string;    // 参数描述
}

export interface PromptTemplate {
  code: string;           // 唯一编码
  name: string;           // 提示词名称
  category: PromptCategory;
  description: string;    // 描述
  content: string;        // 提示词内容
  parameters: PromptParameter[];
}

export type PromptCategory =
  | 'requirement-generation'  // 需求生成
  | 'task-breakdown'         // 任务分解
  | 'similar-search'         // 相似搜索
  | 'requirement-review'     // 需求评审
  | 'ai-score'               // AI评分
  | 'followup-questions'     // 追问问题
  | 'custom';               // 自定义
```

## 提示词配置示例

```typescript
// packages/core/src/prompts/requirement.prompts.ts

import { PromptTemplate } from './prompt.interface';

export const requirementPrompts: PromptTemplate[] = [
  {
    code: 'REQ_GENERATION',
    name: '需求生成',
    category: 'requirement-generation',
    description: '根据项目信息生成需求文档',
    content: `你是一位资深需求分析师，擅长将业务需求转化为清晰、完整的需求文档。

项目信息：
- 项目名称：{{projectName}}
- 项目类型：{{projectType}}
- 业务背景：{{businessContext}}

请按照以下结构生成需求文档：
1. 需求概述
2. 功能需求
3. 非功能需求
4. 约束条件
5. 风险评估

要求：
- 语言简洁明了
- 包含具体的验收标准
- 识别潜在风险点`,
    parameters: [
      { name: 'projectName', type: 'string', required: true, description: '项目名称' },
      { name: 'projectType', type: 'string', required: true, description: '项目类型' },
      { name: 'businessContext', type: 'string', required: true, description: '业务背景' }
    ]
  },
  {
    code: 'FOLLOWUP_QUESTIONS',
    name: '追问问题生成',
    category: 'followup-questions',
    description: '基于需求分析生成追问问题',
    content: `你是一位资深需求分析师，擅长通过追问澄清模糊需求。

已完成的需求分析：
{{requirementSummary}}

请生成 3-5 个关键追问问题，帮助进一步澄清需求。

输出格式：
1. [问题内容]
   - 追问原因：[为什么需要这个问题]
   - 期望回答：[什么样的回答会帮助澄清]

要求：
- 优先询问最关键的问题
- 问题要具体、可回答
- 避免引导性提问`,
    parameters: [
      { name: 'requirementSummary', type: 'string', required: true, description: '需求摘要' }
    ]
  }
];
```

## 服务实现

### PromptService

```typescript
// packages/core/src/prompts/prompt.service.ts

import { Injectable } from '@nestjs/common';
import { RenderService } from './render.service';
import { requirementPrompts } from './requirement.prompts';
import { taskPrompts } from './task.prompts';
import { searchPrompts } from './search.prompts';
import { reviewPrompts } from './review.prompts';
import { PromptTemplate, PromptCategory } from './prompt.interface';

@Injectable()
export class PromptService {
  private prompts: Map<string, PromptTemplate>;

  constructor(private renderService: RenderService) {
    this.prompts = new Map();
    this.loadPrompts();
  }

  private loadPrompts() {
    const allPrompts = [
      ...requirementPrompts,
      ...taskPrompts,
      ...searchPrompts,
      ...reviewPrompts
    ];
    allPrompts.forEach(prompt => {
      this.prompts.set(prompt.code, prompt);
    });
  }

  getByCode(code: string): PromptTemplate | undefined {
    return this.prompts.get(code);
  }

  getByCategory(category: PromptCategory): PromptTemplate[] {
    return Array.from(this.prompts.values())
      .filter(p => p.category === category);
  }

  getAll(): PromptTemplate[] {
    return Array.from(this.prompts.values());
  }

  render(code: string, params: Record<string, any>): string {
    const prompt = this.getByCode(code);
    if (!prompt) {
      throw new Error(`Prompt not found: ${code}`);
    }
    return this.renderService.render(prompt.content, params);
  }
}
```

### RenderService

```typescript
// packages/core/src/prompts/render.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class RenderService {
  render(content: string, params: Record<string, any>): string {
    let result = content;
    
    for (const [key, value] of Object.entries(params)) {
      const placeholder = `{{${key}}}`;
      const regex = new RegExp(this.escapeRegex(placeholder), 'g');
      result = result.replace(regex, String(value ?? ''));
    }
    
    // 移除未填充的占位符
    result = result.replace(/\{\{[^}]+\}\}/g, '');
    
    // 清理多余空行
    result = result.replace(/\n{3,}/g, '\n\n');
    
    return result.trim();
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
```

## 分类定义

```typescript
// packages/core/src/prompts/categories.ts

export const PROMPT_CATEGORIES = {
  'requirement-generation': {
    name: '需求生成',
    description: '用于 AI 生成需求文档的提示词'
  },
  'task-breakdown': {
    name: '任务分解',
    description: '用于将需求分解为任务的提示词'
  },
  'similar-search': {
    name: '相似搜索',
    description: '用于查找相似需求的提示词'
  },
  'requirement-review': {
    name: '需求评审',
    description: '用于 AI 辅助评审需求的提示词'
  },
  'ai-score': {
    name: 'AI评分',
    description: '用于评估需求质量的提示词'
  },
  'followup-questions': {
    name: '追问问题',
    description: '用于生成追问问题的提示词'
  },
  'custom': {
    name: '自定义',
    description: '用户自定义的提示词'
  }
} as const;
```

## 统一导出

```typescript
// packages/core/src/prompts/index.ts

export * from './prompt.interface';
export * from './categories';
export * from './prompt.service';
export * from './render.service';
export * from './requirement.prompts';
export * from './task.prompts';
export * from './search.prompts';
export * from './review.prompts';
```

## 使用示例

### 基本使用

```typescript
import { PromptService } from '@req2task/core';

@Injectable()
export class RequirementService {
  constructor(
    private promptService: PromptService,
    private llmService: LLMService
  ) {}

  async generateRequirement(params: GenerateParams) {
    // 获取渲染后的提示词
    const prompt = this.promptService.render('REQ_GENERATION', {
      projectName: params.projectName,
      projectType: params.projectType,
      businessContext: params.businessContext
    });

    // 调用 LLM
    return this.llmService.call({
      messages: [{ role: 'user', content: prompt }]
    });
  }
}
```

### 获取提示词列表

```typescript
// 获取所有提示词
const allPrompts = this.promptService.getAll();

// 按分类获取
const requirementPrompts = this.promptService.getByCategory('requirement-generation');

// 按编码获取
const followupPrompt = this.promptService.getByCode('FOLLOWUP_QUESTIONS');
```

## API 设计

### 获取提示词列表

```http
GET /api/prompts
```

响应：
```json
{
  "prompts": [
    {
      "code": "REQ_GENERATION",
      "name": "需求生成",
      "category": "requirement-generation",
      "description": "根据项目信息生成需求文档",
      "parameters": [...]
    }
  ]
}
```

### 获取单个提示词

```http
GET /api/prompts/:code
```

### 渲染提示词

```http
POST /api/prompts/:code/render
Content-Type: application/json

{
  "projectName": "电商平台",
  "projectType": "Web应用"
}
```

## 扩展提示词

### 添加新提示词

1. 在对应分类文件中添加提示词配置：

```typescript
// packages/core/src/prompts/review.prompts.ts

export const reviewPrompts: PromptTemplate[] = [
  {
    code: 'REQUIREMENT_REVIEW',
    name: '需求评审',
    category: 'requirement-review',
    description: 'AI 辅助评审需求完整性',
    content: `你是一位资深需求评审专家...
{{requirementContent}}`,
    parameters: [
      { name: 'requirementContent', type: 'string', required: true, description: '需求内容' }
    ]
  }
];
```

2. 在 `index.ts` 中导出新文件

## 注意事项

1. **提示词编码**：使用大写下划线格式，如 `REQ_GENERATION`
2. **参数命名**：使用小驼峰格式，如 `projectName`
3. **分类匹配**：提示词分类需与 `PromptCategory` 类型定义匹配
4. **版本管理**：通过 Git 进行版本控制，修改提示词需提交代码

## 与 LLM 配置集成

提示词服务不直接管理 LLM 配置，通过 LLMService 调用：

```typescript
// 调用时指定 LLM 配置
const response = await this.llmService.callWithConfig(
  llmConfigId,  // 可选，不指定则使用默认配置
  { messages: [{ role: 'user', content: prompt }] }
);
```

## 总结

提示词管理模块通过源码配置方式管理所有提示词，具有以下优势：
- 统一管理，易于维护
- 类型安全，IDE 支持完善
- Git 版本控制，变更可追溯
- 部署简单，无需数据库迁移