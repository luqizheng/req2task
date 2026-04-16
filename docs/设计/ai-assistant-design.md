# AI 辅助需求分析设计

## 1. 概述

### 1.1 设计目标

在需求分析对话界面中，实现 AI 智能辅助：
- 自动关联已有需求/模块/原始需求
- 检测需求逻辑冲突
- 提供上下文感知的智能回复

### 1.2 界面设计

```
┌─────────────────────────────────────────────────────────────┐
│                    需求分析对话界面                          │
├───────────────────────────────┬─────────────────────────────┤
│                               │                             │
│       AI Chat 区域            │      关联分析区域            │
│                               │                             │
│  ┌───────────────────────┐   │  ┌───────────────────────┐  │
│  │ 用户：报表系统需要     │   │  │ 🔴 冲突需求           │  │
│  │ 输出每周发票额度       │   │  │                       │  │
│  └───────────────────────┘   │  │ 需求01 - 入仓单规则   │  │
│                               │  │ 原因：与当前需求冲突   │  │
│  ┌───────────────────────┐   │  │ 操作：标记为草稿      │  │
│  │ AI：根据分析，这个需求 │   │  └───────────────────────┘  │
│  │ 与以下内容相关...      │   │                             │
│  └───────────────────────┘   │  ┌───────────────────────┐  │
│                               │  │ 🟢 相关需求           │  │
│                               │  │                       │  │
│                               │  │ 需求02 - 存放地管理   │  │
│                               │  │ 关联：存放位置不同     │  │
│                               │  └───────────────────────┘  │
│                               │                             │
│                               │  ┌───────────────────────┐  │
│                               │  │ 📁 相关模块           │  │
│                               │  │ 报表模块 > 发票报表    │  │
│                               │  │ 合同管理 > 发票管理    │  │
│                               │  └───────────────────────┘  │
│                               │                             │
└───────────────────────────────┴─────────────────────────────┘
```

---

## 2. 技术架构

### 2.1 三层分析架构

```
用户输入: "报表系统需要输出每周发票额度"
              │
              ▼
┌─────────────────────────────────────────┐
│           第一层：RAG 语义检索           │
│  • 向量数据库检索相关需求/模块           │
│  • 返回语义相似度分数                   │
│  • 使用 ChromaDB                       │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         第二层：LLM 业务逻辑分析         │
│  • 判断冲突类型（数量/归属/流程/约束）  │
│  • 分析关联关系                         │
│  • 生成影响评估                         │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│           第三层：业务规则兜底           │
│  • 处理确定性规则（如 1:1 vs N:1）      │
│  • 可选的规则引擎补充                   │
└─────────────────────────────────────────┘
              │
              ▼
         前端展示
         冲突：红色
         相关：绿色
         模块：蓝色
```

### 2.2 为什么不建 BusinessRule 实体

| 方案 | 适用场景 | 结论 |
|------|----------|------|
| 硬编码规则 | 规则少、稳定 | 不适合，规则难以穷举 |
| Prompt 规则 | 大部分业务分析 | ✅ **最佳选择** |
| 配置化规则 | 可枚举的简单规则 | 复杂度高 |
| 规则实体 | 需动态管理的规则 | 暂时不需要 |

**结论**：使用 LLM 理解业务逻辑，规则在 Prompt 中配置化。

---

## 3. RAG 语义检索设计

### 3.1 向量数据存储

当创建需求/模块时，同时存入向量：

```typescript
// ChromaDB Collection: requirement_context
interface VectorDocument {
  id: string;                    // 唯一ID
  type: 'module' | 'requirement' | 'raw_requirement' | 'user_story';
  content: string;                // 用于向量化的文本内容
  metadata: {
    entityId: string;             // 实体ID
    projectId: string;            // 所属项目
    moduleId?: string;            // 所属模块
    status?: string;              // 需求状态
    createdAt: Date;
  };
}
```

### 3.2 向量化内容策略

```typescript
// 需求向量化内容
function buildRequirementText(requirement: Requirement): string {
  return `
    模块: ${moduleName}
    需求标题: ${requirement.title}
    需求描述: ${requirement.description}
    用户故事: ${userStories.map(us => `${us.role}想要${us.goal}以便于${us.benefit}`).join('; ')}
    验收条件: ${acceptanceCriteria.map(ac => ac.content).join('; ')}
  `.trim();
}

// 模块向量化内容
function buildModuleText(module: FeatureModule): string {
  return `
    模块名称: ${module.name}
    模块描述: ${module.description}
    模块类型: ${module.moduleType}
    子模块: ${childModules.map(m => m.name).join(', ')}
  `.trim();
}
```

### 3.3 检索服务

```typescript
interface SearchResult {
  id: string;
  type: 'module' | 'requirement' | 'raw_requirement';
  entityId: string;
  content: string;
  similarity: number;          // 0-1 相似度
  metadata: Record<string, any>;
}

async function semanticSearch(
  query: string,
  projectId: string,
  limit: number = 10
): Promise<SearchResult[]> {
  // 1. 向量搜索
  const results = await vectorDB.search({
    query,
    collection: 'requirement_context',
    filter: { projectId },
    limit,
  });

  // 2. 按类型分组
  return results;
}
```

---

## 4. LLM 冲突分析设计

### 4.1 冲突分析 Prompt

```typescript
const CONFLICT_ANALYSIS_PROMPT = `
你是需求分析专家，负责检测需求之间的逻辑冲突。

## 你的任务
分析【当前需求】与【历史需求】的逻辑关系，判断是否存在冲突。

## 当前需求
{currentRequirement}

## 历史需求（已向量化检索得到）
{relatedRequirements}

## 冲突类型定义
1. **数量规则冲突**：如"1个物品=1个入仓单" vs "1个入仓单=多个物品"
2. **归属规则冲突**：如"独立存放" vs "统一存放"
3. **流程顺序冲突**：如前置条件互相依赖
4. **数据约束冲突**：如唯一性要求冲突

## 输出要求
请按以下JSON格式输出分析结果：

{
  "hasConflict": true/false,
  "conflicts": [
    {
      "requirementId": "xxx",
      "conflictType": "quantity" | "ownership" | "flow" | "constraint",
      "reason": "详细说明冲突原因",
      "severity": "high" | "medium" | "low"
    }
  ],
  "related": [
    {
      "requirementId": "xxx",
      "relation": "相关但不冲突",
      "detail": "具体关联说明"
    }
  ],
  "actionRequired": true/false,
  "suggestions": [
    "如果冲突，建议的操作"
  ]
}

请只输出JSON，不要有其他内容。
`;

interface ConflictAnalysisResult {
  hasConflict: boolean;
  conflicts: Array<{
    requirementId: string;
    conflictType: 'quantity' | 'ownership' | 'flow' | 'constraint';
    reason: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  related: Array<{
    requirementId: string;
    relation: string;
    detail: string;
  }>;
  actionRequired: boolean;
  suggestions: string[];
}
```

### 4.2 冲突分析服务

```typescript
@Injectable()
export class RequirementConflictService {
  constructor(
    private readonly vectorSearchService: VectorSearchService,
    private readonly llmService: LLMService,
    private readonly requirementService: RequirementService,
  ) {}

  async analyzeConflicts(
    currentRequirement: string,
    projectId: string
  ): Promise<ConflictAnalysisResult> {
    // 1. RAG 检索相关需求
    const relatedRequirements = await this.vectorSearchService.search(
      currentRequirement,
      projectId,
      { limit: 10, types: ['requirement', 'raw_requirement'] }
    );

    if (relatedRequirements.length === 0) {
      return { hasConflict: false, conflicts: [], related: [], actionRequired: false, suggestions: [] };
    }

    // 2. LLM 冲突分析
    const prompt = this.buildConflictPrompt(currentRequirement, relatedRequirements);
    const llmResponse = await this.llmService.call(prompt);

    // 3. 解析结果
    return this.parseAnalysisResult(llmResponse);
  }

  private buildConflictPrompt(current: string, related: SearchResult[]): string {
    const relatedText = related
      .map(r => `[ID: ${r.entityId}]\n内容: ${r.content}\n`)
      .join('\n---\n');

    return CONFLICT_ANALYSIS_PROMPT
      .replace('{currentRequirement}', current)
      .replace('{relatedRequirements}', relatedText);
  }
}
```

---

## 5. 冲突处理流程

### 5.1 冲突状态流转

```
检测到冲突
      │
      ▼
┌──────────────────┐
│ 判断需求状态      │
└──────┬───────────┘
       │
       ├─ 已approved/draft/reviewed
       │         │
       │         ▼
       │   状态改为 draft
       │   记录变更日志
       │
       └─ processing/done
                 │
                 ▼
           ⚠️ 需人工确认
           创建冲突处理任务
           通知项目经理
```

### 5.2 变更日志记录

```typescript
interface ChangeLogEntry {
  requirementId: string;
  changeType: 'conflict_detected' | 'status_change' | 'content_update';
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changeReason: string;
  relatedRequirementId?: string;   // 关联的冲突需求
  conflictType?: string;            // 冲突类型
  changedById: string;
  createdAt: Date;
}
```

---

## 6. API 接口设计

### 6.1 需求分析对话

```http
POST /api/ai/chat
```

**请求**
```json
{
  "projectId": "uuid",
  "message": "报表系统需要输出每周发票额度",
  "context": {
    "currentRequirementId": "uuid",
    "includeModules": true,
    "includeRawRequirements": true
  }
}
```

**响应**
```json
{
  "code": 0,
  "data": {
    "reply": "根据分析，这个需求与以下内容相关...",
    "relatedAnalysis": {
      "conflicts": [
        {
          "id": "uuid",
          "type": "requirement",
          "title": "入仓单规则",
          "conflictType": "quantity",
          "reason": "与当前需求存在数量规则冲突",
          "severity": "high",
          "status": "approved",
          "suggestedAction": "将状态改为草稿"
        }
      ],
      "related": [
        {
          "id": "uuid",
          "type": "requirement",
          "title": "存放地管理",
          "relation": "存放位置不同，相关但不冲突",
          "similarity": 0.85
        }
      ],
      "modules": [
        {
          "id": "uuid",
          "name": "报表模块",
          "path": "报表模块 > 发票报表",
          "similarity": 0.92
        }
      ]
    }
  }
}
```

### 6.2 上下文关联

```http
GET /api/ai/context/:projectId
```

**响应**
```json
{
  "code": 0,
  "data": {
    "modules": [
      { "id": "uuid", "name": "报表模块", "type": "module" }
    ],
    "recentRequirements": [
      { "id": "uuid", "title": "入仓单规则", "status": "approved" }
    ],
    "activeConversations": [
      { "id": "uuid", "summary": "发票报表需求讨论", "createdAt": "datetime" }
    ]
  }
}
```

### 6.3 冲突确认处理

```http
POST /api/ai/resolve-conflict
```

**请求**
```json
{
  "conflictRequirementId": "uuid",
  "action": "mark_draft" | "keep_status" | "merge",
  "mergeRequirementId": "uuid",
  "reason": "确认接受冲突，将需求01标记为草稿"
}
```

---

## 7. 状态机扩展

### 7.1 需求状态扩展

在原有状态基础上，增加处理中/已完成状态：

```typescript
type RequirementStatus =
  | 'draft'           // 草稿
  | 'reviewed'        // 已评审
  | 'approved'        // 已批准
  | 'rejected'        // 已拒绝
  | 'processing'      // 实施中（新增：有任务开始时自动流转）
  | 'completed'       // 已完成（新增：所有任务完成）
  | 'cancelled';     // 已取消
```

### 7.2 状态流转规则

```
draft → reviewed → approved → processing → completed
                ↘ rejected
                         ↘ cancelled
```

| 状态 | 进入条件 | 退出条件 |
|------|----------|----------|
| draft | 初始创建、冲突后降级 | 提交评审 |
| reviewed | PM评审中 | 批准/拒绝 |
| approved | 评审通过 | 任务开始 |
| processing | 有任务状态变为 in_progress | 所有任务完成 |
| completed | 所有关联任务状态为 done | - |
| rejected | 评审不通过 | 重新编辑 |
| cancelled | 手动取消 | - |

---

## 8. 性能优化

### 8.1 向量检索优化

| 策略 | 说明 |
|------|------|
| 项目级隔离 | 只检索当前项目的向量 |
| 类型过滤 | 按模块/需求/原始需求分类检索 |
| 数量限制 | 每次最多返回20个结果 |
| 缓存 | 热门需求向量缓存 |

### 8.2 LLM 调用优化

| 策略 | 说明 |
|------|------|
| 批量分析 | 多个相关需求合并一次调用 |
| 结果缓存 | 相同输入缓存分析结果 |
| 异步处理 | 非关键路径异步执行 |

---

## 9. 实现优先级

### Phase 1：基础能力（1-2周）
1. 向量数据库集成（ChromaDB）
2. 需求/模块向量化存储
3. 语义检索服务
4. 基础冲突分析 Prompt

### Phase 2：增强分析（2周）
1. LLM 冲突类型判断
2. 关联需求展示 UI
3. 状态自动流转
4. 变更日志记录

### Phase 3：智能优化（持续）
1. Prompt 优化迭代
2. 分析准确率提升
3. 性能优化
4. 用户反馈学习

---

## 10. 与其他模块关系

```
AI 辅助分析模块
      │
      ├─ 依赖：FeatureModule（获取模块信息）
      ├─ 依赖：Requirement（获取需求信息）
      ├─ 依赖：RawRequirement（获取原始需求）
      ├─ 依赖：LLMConfig（LLM 配置）
      ├─ 依赖：PromptService（提示词管理）
      ├─ 依赖：ChromaDB（向量存储）
      │
      └─ 输出：冲突分析结果 → 变更日志
            → 需求状态更新
            → 通知
```
