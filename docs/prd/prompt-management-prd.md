# 提示词管理模块 PRD

## 概述

提示词管理模块提供统一的提示词（Prompt）模板管理，支持版本控制、参数化配置和分类管理，为 AI 生成功能提供可维护、可复用的提示词资源。

## 问题背景

现有需求管理系统中，AI 生成功能依赖硬编码提示词，存在以下问题：
1. 提示词分散，难以统一管理
2. 提示词调整需要修改代码
3. 无法追踪提示词使用效果
4. 缺乏提示词版本控制

## 核心需求

### 1. 提示词模板管理
- 创建、编辑、删除提示词模板
- 提示词分类管理
- 提示词版本控制
- 提示词预览和测试

### 2. 参数化提示词
- 支持变量占位符
- 参数类型定义
- 参数验证规则
- 默认值配置

### 3. 提示词使用
- 与 LLM 配置关联
- 场景化调用
- 使用统计

## 功能规格

### 1. 提示词实体设计

```typescript
interface PromptTemplate {
  id: string;
  name: string;           // 提示词名称
  code: string;           // 唯一编码
  description: string;    // 描述
  category: PromptCategory; // 分类
  content: string;        // 提示词内容
  parameters: Parameter[]; // 参数定义
  version: number;        // 当前版本号
  llmConfigId?: string;  // 关联的 LLM 配置
  isActive: boolean;      // 是否启用
  usageCount: number;     // 使用次数
  successRate: number;    // 成功率
  avgLatency: number;     // 平均延迟
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface Parameter {
  name: string;          // 参数名
  type: ParameterType;   // 参数类型
  required: boolean;      // 是否必填
  defaultValue?: string; // 默认值
  description?: string;  // 参数描述
  validation?: string;   // 验证规则
}

type PromptCategory = 
  | 'requirement-generation'  // 需求生成
  | 'task-breakdown'        // 任务分解
  | 'similar-search'         // 相似搜索
  | 'requirement-review'     // 需求评审
  | 'ai-score'               // AI评分
  | 'followup-questions'     // 追问问题
  | 'custom';                // 自定义

type ParameterType = 'string' | 'number' | 'boolean' | 'array' | 'object';
```

### 2. 提示词版本管理

```typescript
interface PromptVersion {
  id: string;
  promptId: string;       // 提示词ID
  version: number;        // 版本号
  content: string;        // 版本内容
  changelog: string;       // 变更说明
  isActive: boolean;      // 是否激活
  createdAt: Date;
  createdBy: string;
}
```

#### 2.1 版本规则
- 每次修改自动创建新版本
- 版本号从 1 开始递增
- 保留所有历史版本
- 支持回滚到指定版本
- 激活指定版本为当前版本

#### 2.2 版本操作
```typescript
interface IPromptVersionService {
  // 创建新版本
  createVersion(promptId: string, content: string, changelog: string): Promise<PromptVersion>;
  
  // 获取版本历史
  getVersionHistory(promptId: string): Promise<PromptVersion[]>;
  
  // 激活指定版本
  activateVersion(promptId: string, version: number): Promise<PromptTemplate>;
  
  // 回滚到指定版本
  rollbackToVersion(promptId: string, version: number): Promise<PromptTemplate>;
  
  // 对比版本差异
  compareVersions(promptId: string, version1: number, version2: number): Promise<VersionDiff>;
}
```

### 3. 参数化提示词

#### 3.1 占位符语法
```typescript
// 提示词内容示例
const prompt = `
请为以下项目生成需求文档：

项目名称：{{projectName}}
项目类型：{{projectType}}
需求描述：{{requirementDescription}}

要求：
- 优先级：{{priority}}
{{#if hasDeadline}}
- 截止日期：{{deadline}}
{{/if}}
{{#each tags}}
- 标签：{{this}}
{{/each}}
`;
```

#### 3.2 参数解析
```typescript
interface ParameterExtractor {
  // 提取提示词中的参数
  extractParameters(content: string): Parameter[];
  
  // 渲染提示词
  render(content: string, params: Record<string, any>): string;
  
  // 验证参数
  validate(params: Record<string, any>, definitions: Parameter[]): ValidationResult;
}
```

#### 3.3 内置函数
- `{{#if condition}}...{{/if}}` - 条件渲染
- `{{#each array}}...{{/each}}` - 循环渲染
- `{{#unless condition}}...{{/unless}}` - 反向条件
- `{{default value}}` - 默认值

### 4. 提示词分类

#### 4.1 系统预定义分类
```typescript
const SYSTEM_CATEGORIES: Record<PromptCategory, CategoryInfo> = {
  'requirement-generation': {
    name: '需求生成',
    description: '用于 AI 生成需求文档的提示词',
    icon: 'document-text',
    color: 'blue'
  },
  'task-breakdown': {
    name: '任务分解',
    description: '用于将需求分解为任务的提示词',
    icon: 'clipboard-list',
    color: 'green'
  },
  'similar-search': {
    name: '相似搜索',
    description: '用于查找相似需求的提示词',
    icon: 'search',
    color: 'purple'
  },
  'requirement-review': {
    name: '需求评审',
    description: '用于 AI 辅助评审需求的提示词',
    icon: 'shield-check',
    color: 'orange'
  },
  'ai-score': {
    name: 'AI评分',
    description: '用于评估需求质量的提示词',
    icon: 'star',
    color: 'yellow'
  },
  'followup-questions': {
    name: '追问问题',
    description: '用于生成追问问题的提示词',
    icon: 'chat',
    color: 'cyan'
  },
  'custom': {
    name: '自定义',
    description: '用户自定义的提示词',
    icon: 'cog',
    color: 'gray'
  }
};
```

### 5. API 设计

#### 5.1 提示词模板 API

**创建提示词**
```http
POST /api/prompts
Content-Type: application/json

{
  "name": "需求生成提示词",
  "code": "REQ_GENERATION_V1",
  "description": "根据项目信息生成需求文档",
  "category": "requirement-generation",
  "content": "请为项目 {{projectName}} 生成需求文档...",
  "parameters": [
    {
      "name": "projectName",
      "type": "string",
      "required": true,
      "description": "项目名称"
    },
    {
      "name": "projectType",
      "type": "string",
      "required": true,
      "description": "项目类型"
    }
  ],
  "llmConfigId": "optional-llm-config-id"
}
```

**获取提示词列表**
```http
GET /api/prompts
Query Params:
- category?: string      # 按分类过滤
- activeOnly?: boolean   # 只返回启用
- page?: number
- limit?: number
- search?: string        # 搜索名称/编码
```

**获取单个提示词**
```http
GET /api/prompts/:id
```

**获取提示词（含最新内容）**
```http
GET /api/prompts/:id/detail
```

**更新提示词**
```http
PUT /api/prompts/:id
Content-Type: application/json

{
  "content": "新的提示词内容...",
  "changelog": "优化了生成格式"
}
```

**删除提示词**
```http
DELETE /api/prompts/:id
```

**复制提示词**
```http
POST /api/prompts/:id/duplicate
Content-Type: application/json

{
  "name": "需求生成提示词（副本）",
  "code": "REQ_GENERATION_V2"
}
```

#### 5.2 版本管理 API

**获取版本历史**
```http
GET /api/prompts/:id/versions
```

**获取指定版本**
```http
GET /api/prompts/:id/versions/:version
```

**激活指定版本**
```http
POST /api/prompts/:id/versions/:version/activate
```

**回滚到指定版本**
```http
POST /api/prompts/:id/versions/:version/rollback
```

**对比版本差异**
```http
GET /api/prompts/:id/versions/compare
Query Params:
- version1: number
- version2: number
```

#### 5.3 提示词使用 API

**渲染提示词**
```http
POST /api/prompts/:id/render
Content-Type: application/json

{
  "projectName": "电商平台",
  "projectType": "Web应用",
  "requirementDescription": "需要支持用户注册登录...",
  "priority": "高"
}
```

**执行提示词**
```http
POST /api/prompts/:id/execute
Content-Type: application/json

{
  "projectName": "电商平台",
  "projectType": "Web应用",
  "requirementDescription": "需要支持用户注册登录...",
  "priority": "高",
  "llmConfigId": "optional-override"  // 可选，覆盖默认配置
}
```

**批量执行提示词**
```http
POST /api/prompts/execute-batch
Content-Type: application/json

{
  "promptId": "prompt-id",
  "items": [
    { "params": {...} },
    { "params": {...} }
  ]
}
```

#### 5.4 分类管理 API

**获取分类列表**
```http
GET /api/prompts/categories
```

**创建自定义分类**
```http
POST /api/prompts/categories
Content-Type: application/json

{
  "name": "数据分析",
  "description": "数据分析相关提示词",
  "icon": "chart",
  "color": "pink"
}
```

### 6. 服务层设计

#### 6.1 提示词服务
```typescript
interface IPromptService {
  // CRUD
  create(dto: CreatePromptDto): Promise<PromptTemplate>;
  findAll(filters: PromptFilters): Promise<PaginatedPrompts>;
  findById(id: string): Promise<PromptTemplate>;
  update(id: string, dto: UpdatePromptDto): Promise<PromptTemplate>;
  delete(id: string): Promise<void>;
  
  // 版本管理
  createVersion(id: string, content: string, changelog: string): Promise<PromptVersion>;
  getVersions(id: string): Promise<PromptVersion[]>;
  activateVersion(id: string, version: number): Promise<PromptTemplate>;
  rollback(id: string, version: number): Promise<PromptTemplate>;
  
  // 执行
  render(id: string, params: Record<string, any>): Promise<string>;
  execute(id: string, params: Record<string, any>): Promise<LLMResponse>;
  
  // 统计
  recordUsage(id: string, result: ExecutionResult): Promise<void>;
  getStatistics(id: string): Promise<PromptStatistics>;
}
```

#### 6.2 提示词渲染服务
```typescript
interface IPromptRenderService {
  // 渲染提示词
  render(content: string, params: Record<string, any>): string;
  
  // 提取参数
  extractParameters(content: string): Parameter[];
  
  // 验证参数
  validate(params: Record<string, any>, definitions: Parameter[]): ValidationResult;
  
  // 编译模板
  compile(content: string): CompiledTemplate;
}
```

### 7. 数据库设计

#### 7.1 表结构
```sql
-- 提示词模板表
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  parameters JSONB DEFAULT '[]',
  version INTEGER DEFAULT 1,
  llm_config_id UUID REFERENCES llm_configs(id),
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  avg_latency INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 提示词版本表
CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  changelog TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(prompt_id, version)
);

-- 提示词分类表
CREATE TABLE prompt_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 提示词使用日志表
CREATE TABLE prompt_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
  llm_config_id UUID REFERENCES llm_configs(id),
  parameters JSONB,
  success BOOLEAN,
  latency INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_prompts_category ON prompt_templates(category);
CREATE INDEX idx_prompts_code ON prompt_templates(code);
CREATE INDEX idx_prompts_is_active ON prompt_templates(is_active);
CREATE INDEX idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
CREATE INDEX idx_prompt_usage_logs_prompt_id ON prompt_usage_logs(prompt_id);
CREATE INDEX idx_prompt_usage_logs_created_at ON prompt_usage_logs(created_at);
```

### 8. 预置提示词模板

#### 8.1 需求生成
```markdown
## 角色
你是一位资深需求分析师，擅长将业务需求转化为清晰、完整的需求文档。

## 任务
根据以下信息生成需求文档：

项目信息：
- 项目名称：{{projectName}}
- 项目类型：{{projectType}}
- 业务背景：{{businessContext}}

## 输出格式
请按照以下结构输出：

1. 需求概述
2. 功能需求
3. 非功能需求
4. 约束条件
5. 风险评估

## 要求
- 语言简洁明了
- 包含具体的验收标准
- 识别潜在风险点
```

#### 8.2 任务分解
```markdown
## 角色
你是一位经验丰富的项目经理，擅长将需求分解为可执行的任务。

## 任务
将以下需求分解为具体的开发任务：

需求信息：
- 需求标题：{{requirementTitle}}
- 需求描述：{{requirementDescription}}
- 优先级：{{priority}}
{{#if hasDeadline}}
- 截止日期：{{deadline}}
{{/if}}

## 输出格式
请为每个任务包含：
- 任务名称
- 任务描述
- 预计工时
- 依赖任务
- 验收标准
```

#### 8.3 追问问题生成
```markdown
## 角色
你是一位资深需求分析师，擅长通过追问澄清模糊需求。

## 上下文
已完成的需求分析：
{{requirementSummary}}

## 任务
生成 3-5 个关键追问问题，帮助进一步澄清需求。

## 输出格式
请按以下格式输出：
1. [问题内容]
   - 追问原因：[为什么需要这个问题]
   - 期望回答：[什么样的回答会帮助澄清]

## 要求
- 优先询问最关键的问题
- 问题要具体、可回答
- 避免引导性提问
```

### 9. 与 LLM 配置集成

#### 9.1 调用流程
```typescript
class PromptExecutor {
  constructor(
    private promptService: IPromptService,
    private llmConfigService: ILLMConfigService
  ) {}

  async execute(promptId: string, params: Record<string, any>): Promise<LLMResponse> {
    // 1. 获取提示词模板
    const prompt = await this.promptService.findById(promptId);
    
    // 2. 渲染提示词
    const renderedContent = this.renderService.render(prompt.content, params);
    
    // 3. 获取 LLM 配置（模板指定 > 系统默认）
    const llmConfig = prompt.llmConfigId 
      ? await this.llmConfigService.findById(prompt.llmConfigId)
      : await this.llmConfigService.getDefaultConfig();
    
    // 4. 调用 LLM
    const result = await this.llmService.call({
      messages: [{ role: 'user', content: renderedContent }],
      config: llmConfig
    });
    
    // 5. 记录使用日志
    await this.promptService.recordUsage(promptId, {
      llmConfigId: llmConfig.id,
      params,
      result
    });
    
    return result;
  }
}
```

#### 9.2 配置优先级
1. 提示词模板指定的 LLM 配置
2. 系统全局默认配置
3. 提供商默认配置

### 10. 使用统计与监控

#### 10.1 统计指标
```typescript
interface PromptStatistics {
  totalUsage: number;           // 总使用次数
  successRate: number;          // 成功率
  averageLatency: number;       // 平均延迟
  usageByDay: UsageByDay[];     // 每日使用趋势
  usageByCategory: UsageByCategory[];  // 分类使用统计
  topParameters: TopParameter[];      // 高频参数
  errorDistribution: ErrorDistribution[];  // 错误分布
}
```

#### 10.2 统计 API
```http
GET /api/prompts/:id/statistics
Query Params:
- startDate?: string
- endDate?: string
- groupBy?: 'day' | 'week' | 'month'
```

#### 10.3 监控告警
- 使用成功率低于阈值时告警
- 延迟异常增长时告警
- 提示词被大量使用时通知

### 11. 权限控制

#### 11.1 权限矩阵
| 操作 | 管理员 | 编辑者 | 查看者 |
|------|--------|--------|--------|
| 创建提示词 | ✓ | ✓ | ✗ |
| 编辑提示词 | ✓ | ✓ | ✗ |
| 删除提示词 | ✓ | ✗ | ✗ |
| 管理分类 | ✓ | ✗ | ✗ |
| 查看提示词 | ✓ | ✓ | ✓ |
| 执行提示词 | ✓ | ✓ | ✓ |
| 查看统计 | ✓ | ✓ | ✓ |

#### 11.2 提示词级别权限
```typescript
interface PromptPermission {
  promptId: string;
  userId: string;
  canEdit: boolean;
  canDelete: boolean;
  canExecute: boolean;
}
```

### 12. 导入导出

#### 12.1 导出格式
```json
{
  "version": "1.0",
  "exportedAt": "2024-01-15T10:30:00Z",
  "prompts": [
    {
      "name": "需求生成提示词",
      "code": "REQ_GENERATION",
      "category": "requirement-generation",
      "content": "...",
      "parameters": [...],
      "llmConfigId": null
    }
  ]
}
```

#### 12.2 导入规则
- 支持覆盖现有提示词（按 code 匹配）
- 支持创建新提示词
- 导入前进行参数验证
- 支持部分导入

### 13. 测试提示词

#### 13.1 在线测试
```http
POST /api/prompts/:id/test
Content-Type: application/json

{
  "params": {
    "projectName": "测试项目",
    "projectType": "Web应用"
  },
  "llmConfigId": "test-config-id",
  "maxTokens": 1000
}
```

#### 13.2 测试响应
```json
{
  "renderedPrompt": "渲染后的提示词...",
  "llmResponse": "LLM 返回内容...",
  "latency": 1234,
  "tokensUsed": 500
}
```

### 14. 错误处理

#### 14.1 错误类型
```typescript
enum PromptError {
  PROMPT_NOT_FOUND = 'PROMPT_NOT_FOUND',
  PROMPT_CODE_EXISTS = 'PROMPT_CODE_EXISTS',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  PARAMETER_REQUIRED = 'PARAMETER_REQUIRED',
  PARAMETER_TYPE_MISMATCH = 'PARAMETER_TYPE_MISMATCH',
  VERSION_NOT_FOUND = 'VERSION_NOT_FOUND',
  LLM_CONFIG_NOT_FOUND = 'LLM_CONFIG_NOT_FOUND',
  EXECUTION_FAILED = 'EXECUTION_FAILED'
}
```

#### 14.2 错误响应
```json
{
  "error": "INVALID_PARAMETER",
  "message": "参数验证失败",
  "details": {
    "parameter": "projectName",
    "expectedType": "string",
    "received": 123,
    "validationRule": "minLength: 1"
  }
}
```

### 15. 缓存策略

#### 15.1 缓存内容
- 提示词模板（TTL: 5分钟）
- 渲染后的模板（TTL: 1小时）
- 分类列表（TTL: 24小时）

#### 15.2 缓存失效
- 更新提示词时删除缓存
- 删除提示词时删除缓存
- 手动刷新缓存接口

### 16. 性能优化

#### 16.1 批量处理
- 支持批量渲染提示词
- 支持批量执行（带限流）

#### 16.2 异步执行
- 大型提示词支持异步执行
- 异步任务状态查询

### 17. 集成点

#### 17.1 与需求管理集成
```typescript
// 需求创建时调用提示词
class RequirementService {
  async createRequirement(projectId: string, data: CreateRequirementDto) {
    // AI 辅助生成需求
    const generatedContent = await this.promptExecutor.execute(
      'REQ_GENERATION_V1',
      { projectId, ...data }
    );
    
    // 保存需求
    return this.requirementRepo.save({
      ...data,
      aiGeneratedContent: generatedContent
    });
  }
}
```

#### 17.2 与任务管理集成
```typescript
// 需求分解为任务
class TaskService {
  async breakdownRequirement(requirementId: string) {
    const requirement = await this.getRequirement(requirementId);
    
    const tasks = await this.promptExecutor.execute(
      'TASK_BREAKDOWN_V1',
      {
        requirementTitle: requirement.title,
        requirementDescription: requirement.description,
        priority: requirement.priority
      }
    );
    
    return this.createTasks(tasks);
  }
}
```

### 18. 未来扩展

#### 18.1 短期扩展
- 提示词模板市场
- 提示词评分系统
- 提示词推荐引擎

#### 18.2 长期扩展
- 提示词协同编辑
- 提示词 A/B 测试
- 提示词自动优化

## 总结

提示词管理模块提供完整的提示词生命周期管理，支持版本控制、参数化配置和分类管理。通过与 LLM 配置模块的深度集成，实现灵活、高效的 AI 调用能力。