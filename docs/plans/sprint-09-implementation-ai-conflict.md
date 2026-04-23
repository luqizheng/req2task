# Sprint 09: AI 冲突检测

**计划类型**: 后端实施路线图
**目标**: RAG 语义检索、LLM 冲突分析、冲突展示 UI
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M4

---

## 1. 目标

- RAG 语义检索
- LLM 冲突分析
- 冲突展示 UI

---

## 2. 任务列表

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| 语义检索服务 | dev | 8h | P0 | ⏳ |
| 冲突分析 Prompt | dev | 6h | P0 | ⏳ |
| 冲突分析服务 | dev | 8h | P0 | ⏳ |
| AI Chat API | dev | 8h | P0 | ⏳ |
| 冲突检测触发器 | dev | 4h | P0 | ⏳ |
| 关联需求展示 UI | dev | 8h | P0 | ⏳ |
| 前端 Chat 界面 | dev | 8h | P0 | ⏳ |

**总预估工时**: 50h

---

## 3. 交付物

- 冲突检测服务
- AI Chat API
- 前端 Chat 页面

---

## 4. 验收标准

- [ ] 输入需求可检索相关需求
- [ ] 可检测逻辑冲突
- [ ] 冲突结果正确展示
- [ ] Chat 界面正常交互

---

## 5. API 设计

### 5.1 语义检索 API

```typescript
// 后端接口
GET    /ai/semantic-search                              // 语义检索
```

### 5.2 冲突检测 API

```typescript
// 后端接口
POST   /ai/raw-requirements/:id/detect-conflicts       // 检测冲突
```

### 5.3 AI Chat API

```typescript
// 后端接口
POST   /ai/chat                           // 通用对话
POST   /ai/ai-chat                        // 带上下文的对话
```

---

## 6. 冲突类型

| 冲突类型 | 说明 | 示例 |
|----------|------|------|
| 逻辑冲突 | 需求之间逻辑矛盾 | "必须登录" vs "无需登录" |
| 依赖冲突 | 依赖关系矛盾 | A 依赖 B，B 依赖 A |
| 重复冲突 | 需求重复 | 两个需求描述相同功能 |
| 优先级冲突 | 优先级矛盾 | 高优先级需求被低优先级阻塞 |

---

## 7. 冲突检测 Prompt

```markdown
你是一个资深需求分析师。请分析以下需求列表，检测潜在的冲突。

需求列表：
{requirements}

请识别以下类型的冲突：
1. 逻辑冲突
2. 依赖冲突
3. 重复冲突
4. 优先级冲突

对于每个冲突，请说明：
- 冲突类型
- 涉及的需求
- 冲突原因
- 建议的解决方案
```

---

## 8. 依赖关系

- **前置条件**: Sprint 8 AI 需求生成完成
- **后续 Sprint**: Sprint 10 需要冲突检测服务

---

## 9. 完成标准

- [ ] 语义检索结果准确
- [ ] 冲突检测逻辑正确
- [ ] AI Chat 响应正常
- [ ] 单元测试覆盖率 ≥ 70%

---

**上一 Sprint**: [Sprint 08: AI 需求生成](sprint-08-implementation-ai-requirement-gen.md)
**下一 Sprint**: [Sprint 10: AI 增强与优化](sprint-10-implementation-ai-enhancement.md)
