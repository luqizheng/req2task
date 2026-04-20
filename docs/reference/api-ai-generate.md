# AI 生成 API

AI 生成服务提供需求生成、任务分解、评审等 AI 辅助能力。

## 端点总览

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/ai-generate/requirements` | POST | AI 生成需求列表 |
| `/ai-generate/user-stories` | POST | AI 生成用户故事 |
| `/ai-breakdown/tasks` | POST | AI 分解任务并估算工时 |
| `/ai-generate/prd` | POST | AI 生成 PRD 文档 |
| `/ai-score` | POST | AI 评审预判 |
| `/ai/similar` | POST | AI 推荐相似需求 |
| `/ai/resolve-conflict` | POST | 冲突确认处理 |
| `/ai/semantic-search` | GET | 语义搜索 |

---

## 需求生成

### AI 生成需求列表

使用 `REQUIREMENT_GENERATION` 提示词模板，从原始需求和对话内容生成结构化需求。

```http
POST /ai-generate/requirements
Content-Type: application/json

{
  "projectId": "uuid",             // 可选：项目ID
  "rawRequirement": "原始需求内容",
  "conversation": "对话内容（可选）",
  "context": "上下文信息（可选）",
  "configId": "uuid"               // 可选：LLM配置ID
}
```

**响应：**

```json
{
  "code": 0,
  "data": [
    {
      "title": "需求标题",
      "description": "需求详细描述",
      "type": "功能需求",
      "priority": "高"
    },
    {
      "title": "另一个需求",
      "description": "需求描述",
      "type": "性能需求",
      "priority": "中"
    }
  ]
}
```

### AI 生成用户故事

使用 `USER_STORY_GENERATION` 提示词模板，将需求转换为标准用户故事格式。

```http
POST /ai-generate/user-stories
Content-Type: application/json

{
  "requirementId": "uuid",
  "projectId": "uuid",
  "configId": "uuid"
}
```

**响应：**

```json
{
  "code": 0,
  "data": [
    {
      "title": "用户故事标题",
      "asA": "作为产品经理",
      "iWant": "我想要一个需求评审功能",
      "soThat": "以便快速评估需求的可行性",
      "acceptanceCriteria": ["验收标准1", "验收标准2"],
      "priority": "高"
    }
  ]
}
```

---

## 任务分解

### AI 分解任务并估算工时

使用 `TASK_BREAKDOWN` 提示词模板，将功能点分解为开发任务。

```http
POST /ai-breakdown/tasks
Content-Type: application/json

{
  "projectId": "uuid",             // 可选
  "requirementId": "uuid",
  "requirementTitle": "需求标题",
  "requirementDescription": "需求描述",
  "existingTasks": "已有任务列表（可选，用于避免重复）",
  "configId": "uuid"               // 可选
}
```

**响应：**

```json
{
  "code": 0,
  "data": [
    {
      "title": "任务标题",
      "description": "任务描述",
      "priority": 1,
      "estimatedHours": 8
    },
    {
      "title": "另一个任务",
      "description": "任务描述",
      "priority": 2,
      "estimatedHours": 4
    }
  ]
}
```

---

## PRD 生成

### AI 生成 PRD 文档

使用 `PRD_GENERATION` 提示词模板，根据对话内容生成结构化产品需求文档。

```http
POST /ai-generate/prd
Content-Type: application/json

{
  "conversationText": "对话内容",
  "configId": "uuid"               // 可选
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "content": "# 产品需求文档\n\n## 概述\n\n..."
  }
}
```

---

## AI 评审

### AI 评审预判

使用 `REQUIREMENT_REVIEW` 提示词模板，评审需求的完整性和质量。

```http
POST /ai-score
Content-Type: application/json

{
  "projectId": "uuid",             // 可选
  "requirementContent": "需求内容",
  "context": "上下文信息（可选）",
  "configId": "uuid"                // 可选
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "score": 75,
    "dimensions": {
      "clarity": 80,
      "completeness": 70,
      "feasibility": 75
    },
    "suggestions": [
      {
        "dimension": "completeness",
        "priority": "high",
        "suggestion": "建议补充非功能性需求",
        "reason": "缺少性能指标定义"
      }
    ]
  }
}
```

---

## 语义搜索与推荐

### AI 推荐相似需求

```http
POST /ai/similar
Content-Type: application/json

{
  "projectId": "uuid",
  "requirementText": "需求文本",
  "limit": 5                        // 可选，默认5
}
```

**响应：**

```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "title": "相似需求标题",
      "similarity": 0.85,
      "content": "需求内容..."
    }
  ]
}
```

### 语义搜索

```http
GET /ai/semantic-search?query=搜索内容&limit=10
```

**响应：**

```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "title": "搜索结果标题",
      "content": "相关内容...",
      "score": 0.92
    }
  ]
}
```

---

## 冲突处理

### 冲突确认处理

```http
POST /ai/resolve-conflict
Content-Type: application/json

{
  "requirementIds": ["uuid1", "uuid2"],
  "conflictDescription": "冲突描述",
  "resolution": "解决建议（可选）",
  "configId": "uuid"
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "resolved": true,
    "mergedRequirement": {
      "title": "合并后的需求",
      "description": "合并后的描述"
    },
    "changes": ["变更说明1", "变更说明2"]
  }
}
```

---

## 提示词模板

AI 生成 API 使用以下提示词模板（定义在 `packages/core/src/prompts/`）：

| 模板代码 | 用途 | 主要参数 |
|----------|------|----------|
| `REQUIREMENT_GENERATION` | 需求生成 | rawRequirement, conversation, context |
| `USER_STORY_GENERATION` | 用户故事生成 | requirementId |
| `TASK_BREAKDOWN` | 任务分解 | requirementTitle, requirementDescription |
| `PRD_GENERATION` | PRD 文档生成 | conversationText |
| `REQUIREMENT_REVIEW` | 需求评审 | requirementContent, context |
| `MODULE_DECOMPOSITION` | 模块分解 | requirements, existingModulesTree |
| `FEATURE_POINT_DECOMPOSITION` | 功能点分解 | requirementTitle, requirementDescription |

### 请求参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectId | string | 否 | 项目ID |
| rawRequirement | string | 是* | 原始需求内容 |
| conversation | string | 否 | 对话内容 |
| context | string | 否 | 上下文信息 |
| configId | string | 否 | LLM配置ID，不传则使用默认配置 |
