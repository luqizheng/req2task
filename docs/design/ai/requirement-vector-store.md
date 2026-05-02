# 需求向量化存储与关联分析

## 1. 概述

### 1.1 目标

通过向量数据库实现需求相似度检索，自动检测需求间的关联关系（相似/冲突），辅助需求分析师发现重复需求和潜在冲突。

### 1.2 架构

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Requirement    │ ──▶ │ ChromaVectorStore│ ──▶ │  ChromaDB   │
│  (内容文本)       │     │  (嵌入生成)      │     │  (存储)     │
└─────────────────┘     └──────────────────┘     └─────────────┘
                                │
                                ▼
                        ┌──────────────┐
                        │   Ollama      │
                        │ nomic-embed   │
                        └──────────────┘
```

## 2. 组件设计

### 2.1 ChromaVectorStore

**位置**: `packages/core/src/ai/chroma-vector-store.ts`

**职责**:
- 连接 ChromaDB 服务
- 管理 collection（默认 `requirements`）
- 提供 add/search/delete 接口

**配置**:
```typescript
interface ChromaConfig {
  host: string;
  port: number;
  authToken?: string;
}
```

### 2.2 OllamaEmbedding

**位置**: `packages/core/src/ai/ollama-embedding.ts`

**职责**:
- 连接 Ollama 服务
- 调用 embedding 模型生成向量

**配置**:
```typescript
interface OllamaConfig {
  host: string;
  port: number;
  model?: string;  // 默认 nomic-embed-text
}
```

### 2.3 RequirementVectorService

**位置**: `apps/service/src/ai/requirement-vector.service.ts`

**职责**:
- 需求向量化索引
- 相似需求搜索
- 向量重建

**接口**:
```typescript
interface RequirementVectorService {
  indexRequirement(requirement: Requirement): Promise<void>;
  indexRawRequirement(rawRequirement: RawRequirement): Promise<void>;
  removeRequirement(requirementId: string): Promise<void>;
  searchSimilarRequirements(query: string, projectId: string, limit?: number): Promise<SearchResult[]>;
  rebuildAll(projectId?: string): Promise<{ requirements: number; rawRequirements: number }>;
}
```

### 2.4 RequirementRelationDetectionService

**位置**: `apps/service/src/ai/requirement-relation-detection.service.ts`

**职责**:
- 检测相似需求（向量相似度 > 60%）
- 检测冲突需求（关键词匹配）

**接口**:
```typescript
interface RelatedRequirement {
  id: string;
  entityKey: string;
  title: string;
  content: string;
  score: number;
  relationType: 'similar' | 'conflict' | 'extends' | 'depends';
}

interface RelationDetectionResult {
  hasRelated: boolean;
  relatedRequirements: RelatedRequirement[];
  conflictRequirements: RelatedRequirement[];
}
```

## 3. 数据流

### 3.1 需求创建流程

```
1. 用户提交原始需求
2. RequirementRelationDetectionService.detectRelations()
   - 调用向量搜索获取相似需求
   - 关键词冲突检测
3. 返回关联需求列表
4. AI 生成需求时注入关联信息到 prompt
5. RequirementVectorService.indexRequirement() 索引新需求
```

### 3.2 向量存储格式

```typescript
interface VectorDocument {
  id: string;           // "requirement:${id}" 或 "raw_requirement:${id}"
  content: string;       // title + content + keyElements
  metadata: {
    projectId: string;
    moduleId?: string;
    type: 'requirement' | 'raw_requirement';
  };
}
```

## 4. 配置说明

### 4.1 环境变量

```bash
# ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_AUTH_TOKEN=chroma123456

# Ollama
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

### 4.2 Docker 服务

```yaml
# docker-compose.dev.yml
chromadb:
  image: chromadb/chroma:latest
  ports:
    - "${CHROMA_PORT}:8000"

ollama:
  image: ollama/ollama:latest
  ports:
    - "${OLLAMA_PORT:-11434}:11434"
```

## 5. 运维命令

```bash
# 启动基础设施
pnpm dev:infra

# 安装 embedding 模型
docker exec ai-sowf-ollama ollama pull nomic-embed-text

# 重建向量索引
pnpm rebuild:vector

# 仅重建指定项目
pnpm rebuild:vector -p <project-id>
```

## 6. 数据库变更

需求表新增字段：

```sql
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS key_elements TEXT[];
```

## 7. 限制与注意事项

1. **首次使用需安装模型**: `docker exec ai-sowf-ollama ollama pull nomic-embed-text`
2. **Ollama 需 GPU 支持**: embedding 模型建议在有 GPU 的环境运行
3. **向量重建**: 新增 content/keyElements 字段后需执行 `pnpm rebuild:vector`

## 8. 后续优化方向

1. **语义冲突检测**: 引入 LLM 分析冲突类型
2. **关联关系持久化**: 将检测到的关系存入数据库
3. **实时索引**: 使用事件驱动替代批量索引
