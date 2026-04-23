# Sprint 07: AI 基础设施

**计划类型**: 后端实施路线图
**目标**: LLM 配置模块、提示词管理、向量数据库集成
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M3

---

## 1. 目标

- LLM 配置模块
- 提示词管理
- 向量数据库集成

---

## 2. 任务列表

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| LLM Config Entity | dev | 6h | P0 | ⏳ |
| LLM ConfigService | dev | 8h | P0 | ⏳ |
| LLM Provider 抽象 | dev | 8h | P0 | ⏳ |
| DeepSeek Provider | dev | 4h | P0 | ⏳ |
| OpenAI Provider | dev | 4h | P1 | ⏳ |
| PromptService 开发 | dev | 6h | P0 | ⏳ |
| ChromaDB 集成 | dev | 8h | P0 | ⏳ |
| 向量存储服务 | dev | 6h | P0 | ⏳ |

**总预估工时**: 50h

---

## 3. 交付物

- LLM 配置管理
- 提示词服务
- 向量数据库服务

---

## 4. 验收标准

- [ ] 可配置 LLM
- [ ] 可调用 DeepSeek API
- [ ] ChromaDB 可用
- [ ] 向量可存储/检索

---

## 5. API 设计

### 5.1 LLM Config API

```typescript
// 后端接口
GET    /ai/llm-configs                    // 配置列表
GET    /ai/llm-configs/:id                // 详情
POST   /ai/llm-configs                    // 创建
PUT    /ai/llm-configs/:id                // 更新
DELETE /ai/llm-configs/:id                // 删除
```

---

## 6. LLM Provider 架构

```typescript
interface LLMProvider {
  name: string
  chat(messages: Message[]): Promise<string>
  streamChat(messages: Message[]): Observable<string>
}

class DeepSeekProvider implements LLMProvider {
  constructor(config: LLMConfig)
  chat(messages: Message[]): Promise<string>
  streamChat(messages: Message[]): Observable<string>
}

class OpenAIProvider implements LLMProvider {
  constructor(config: LLMConfig)
  chat(messages: Message[]): Promise<string>
  streamChat(messages: Message[]): Observable<string>
}
```

---

## 7. 向量存储设计

```typescript
interface VectorStore {
  add(text: string, metadata: object): Promise<string>
  search(query: string, topK: number): Promise<SearchResult[]>
  delete(id: string): Promise<void>
}

interface SearchResult {
  id: string
  text: string
  score: number
  metadata: object
}
```

---

## 8. 依赖关系

- **前置条件**: Sprint 6 任务状态与看板完成
- **后续 Sprint**: Sprint 8 需要 AI 基础设施

---

## 9. 完成标准

- [ ] LLM 配置可正常管理
- [ ] DeepSeek API 可正常调用
- [ ] 向量可正确存储和检索
- [ ] 单元测试覆盖率 ≥ 70%

---

**上一 Sprint**: [Sprint 06: 任务状态与看板](sprint-06-implementation-task-board.md)
**下一 Sprint**: [Sprint 08: AI 需求生成](sprint-08-implementation-ai-requirement-gen.md)
