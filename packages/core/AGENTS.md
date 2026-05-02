# AGENTS.md - packages/core

## 包概述

`packages/core` 是 req2task 的后端核心业务代码包，提供实体定义和服务层。

## 依赖关系

- 被 `apps/service` (NestJS 后端) 依赖
- 使用 TypeORM 进行 ORM 映射
- 与 `packages/dto` 配合使用进行数据传输

## 目录结构

```
packages/core/src/
├── entities/           # TypeORM 实体定义
│   ├── user.entity.ts      # 用户实体
│   ├── project.entity.ts   # 项目实体
│   ├── requirement.entity.ts  # 需求实体
│   └── feature-module.entity.ts  # 功能模块实体
├── ai/               # AI 向量存储
│   ├── vector-store.interface.ts  # 向量存储接口
│   ├── chroma-vector-store.ts     # ChromaDB 实现
│   └── ollama-embedding.ts        # Ollama embedding
├── services/          # 业务服务层
│   └── user.service.ts     # 用户服务
├── prompts/           # AI Prompt 模板
│   ├── prompt.interface.ts
│   └── requirement.prompts.ts
├── bo/                # 业务对象
│   ├── index.ts
│   └── user.bo.ts
└── index.ts           # 导出入口
```

## 实体说明

### User 实体

- `UserRole` 枚举: `ADMIN`, `USER`, `PROJECT_MANAGER`
- 字段: id, username, email, displayName, role, passwordHash
- 自动时间戳: createdAt, updatedAt

### Project 实体

- `ProjectStatus` 枚举: `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`
- 字段: id, name, description, projectKey, status, startDate, endDate, ownerId
- 关联: members (多对多 User), ownerId (外键)
- 自动时间戳: createdAt, updatedAt

### FeatureModule 实体

- 树形结构支持: parentId, parent, children
- 字段: id, name, description, moduleKey, sort, parentId, projectId
- 关联: project (多对一), parent/children (自关联)
- 自动时间戳: createdAt, updatedAt

### Requirement 实体

- 字段: id, entityKey, title, content, description, keyElements, priority, source, status, storyPoints, parentId
- 关联: modules (多对多 FeatureModule), sourceRawRequirement, userStories, children, parent
- 新增: content (向量化存储), keyElements (摘要列表)
- 自动时间戳: createdAt, updatedAt

## AI 向量存储

### VectorStore 接口

```typescript
interface VectorDocument {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
}

interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

interface VectorStore {
  add(documents: VectorDocument[]): Promise<void>;
  search(query: string, limit?: number): Promise<SearchResult[]>;
  delete(ids: string[]): Promise<void>;
  deleteByFilter(filter: Record<string, unknown>): Promise<void>;
}
```

### ChromaVectorStore

- 连接 ChromaDB 服务进行向量存储
- 使用 Ollama 生成 embedding
- Collection: `requirements`

### OllamaEmbedding

- 调用 Ollama API 生成文本向量
- 默认模型: `nomic-embed-text`
- 配置: OLLAMA_HOST, OLLAMA_PORT, OLLAMA_EMBEDDING_MODEL

### 配置要求

```bash
# .env (apps/service/.env)
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_AUTH_TOKEN=chroma123456

OLLAMA_HOST=localhost
OLLAMA_PORT=11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

## 开发说明

### 命名规范

- 实体文件: `*.entity.ts`
- 服务文件: `*.service.ts`
- 业务对象: `*.bo.ts`
- 使用 PascalCase 命名类和类型
- 使用 camelCase 命名变量和函数
- 数据库字段使用 snake_case

### TypeORM 使用

- 使用装饰器定义实体
- `PrimaryGeneratedColumn('uuid')` 生成 UUID 主键
- 使用 `CreateDateColumn` 和 `UpdateDateColumn` 自动管理时间戳
- 使用 `ManyToOne`/`OneToMany` 定义关系

### 添加新实体步骤

1. 在 `src/entities/` 创建 `*.entity.ts`
2. 在 `entities/index.ts` 导出
3. 在 `src/index.ts` 确保导出

### 添加新服务步骤

1. 在 `src/services/` 创建 `*.service.ts`
2. 在 `services/index.ts` 导出
3. 在 `src/index.ts` 确保导出

## 测试

- 测试文件应放在 `__tests__/` 目录
- 使用 Vitest 框架
- 命令: `pnpm test --filter @req2task/core`

## Prompt 模板

### 定义位置

- `src/prompts/requirement.prompts.ts` - 需求相关 prompt
- 使用 `PromptTemplate` 接口定义

### 模板参数

```typescript
interface PromptTemplate {
  code: string;           // 模板代码
  name: string;           // 模板名称
  systemPrompt: string;    // 系统提示词
  userPromptTemplate: string;  // 用户提示模板 (mustache)
  parameters: Parameter[]; // 参数定义
  temperature?: number;
  maxTokens?: number;
  isActive?: boolean;
}
```

### 常用模板

| Code | 用途 |
|------|------|
| REQUIREMENT_GENERATION | 从原始需求生成结构化需求 |
| RAW_REQUIREMENT_ANALYSIS | 分析原始需求提取关键要素 |
| USER_STORY_GENERATION | 从需求生成用户故事 |

### 相关Requirements 参数

`REQUIREMENT_GENERATION` 模板支持 `relatedRequirements` 参数，用于注入关联需求分析结果。
