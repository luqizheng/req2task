---
last_updated: 2024-02-01
status: active
owner: req2task团队
---

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
│       AI Chat 区域            │      关联分析区域            │
│                               │                             │
│  ┌───────────────────────┐   │  ┌───────────────────────┐  │
│  │ 用户：报表系统需要     │   │  │ 🔴 冲突需求           │  │
│  │ 输出每周发票额度       │   │  └───────────────────────┘  │
│  └───────────────────────┘   │  ┌───────────────────────┐  │
│                               │  │ 🟢 相关需求           │  │
│  ┌───────────────────────┐   │  └───────────────────────┘  │
│  │ AI：根据分析...        │   │  ┌───────────────────────┐  │
│  └───────────────────────┘   │  │ 📁 相关模块           │  │
│                               │  └───────────────────────┘  │
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
```

---

## 3. RAG 语义检索设计

### 3.1 向量数据存储

```typescript
// ChromaDB Collection: requirement_context
interface VectorDocument {
  id: string;
  type: 'module' | 'requirement' | 'raw_requirement' | 'user_story';
  content: string;
  metadata: {
    entityId: string;
    projectId: string;
    moduleId?: string;
    status?: string;
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
  "conflicts": [...],
  "related": [...],
  "actionRequired": true/false,
  "suggestions": [...]
}
`;
```

---

## 5. API 接口设计

### 5.1 需求分析对话

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

### 5.2 上下文关联

```http
GET /api/ai/context/:projectId
```

### 5.3 冲突确认处理

```http
POST /api/ai/resolve-conflict
```

---

## 6. 状态机扩展

### 6.1 需求状态扩展

```typescript
type RequirementStatus =
  | 'draft'
  | 'reviewed'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'completed'
  | 'cancelled';
```

### 6.2 状态流转规则

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

---

## 7. 实现优先级

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
