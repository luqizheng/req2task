# Sprint 14: 修复 RawRequirement 与 Requirement 关系

**计划类型**: 后端实施路线图
**目标**: RawRequirement → Requirement 从 1:1 改为 1:N，新增原始需求关联字段
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M6

---

## 1. 目标

- RawRequirement 支持关联多个其他 RawRequirement（版本链、相关需求）
- RawRequirement → Requirement 改为 1:N 关系
- AI 自动关联建议 + 用户手动关联

---

## 2. 后端任务列表

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| RawRequirement 模型新增 `relatedRawRequirementIds` JSON 字段 | dev | 2h | P0 | ⏳ |
| RawRequirement → Requirement 1:N 关系改造 | dev | 6h | P0 | ⏳ |
| 原始需求关联 API（添加/删除关联） | dev | 4h | P0 | ⏳ |
| AI 关联建议服务 | dev | 8h | P1 | ⏳ |
| 获取关联原始需求列表 API | dev | 2h | P0 | ⏳ |

**后端预估工时**: 22h

---

## 3. 前端任务列表

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| 原始需求详情页 - 关联列表展示 | dev | 4h | P0 | ⏳ |
| 原始需求关联操作 UI（添加/移除） | dev | 4h | P0 | ⏳ |
| AI 关联建议展示 + 采纳 UI | dev | 6h | P1 | ⏳ |
| 原始需求版本链视图 | dev | 4h | P1 | ⏳ |

**前端预估工时**: 18h

---

## 4. 交付物

- RawRequirement 新增 `relatedRawRequirementIds` 字段
- RawRequirement → Requirement 1:N 改造
- 原始需求关联管理 UI
- AI 关联建议功能

---

## 5. 验收标准

- [ ] RawRequirement 可存储关联的原始需求 ID 数组
- [ ] 一个 RawRequirement 可关联多个 Requirement
- [ ] 用户可手动添加/移除关联
- [ ] AI 可建议关联并被用户采纳/拒绝

---

## 6. 数据模型

### RawRequirement 扩展

```typescript
interface RawRequirement {
  id: UUID;
  content: string;
  source: string;
  status: 'pending' | 'processing' | 'converted' | 'discarded';
  relatedRawRequirementIds: string[];  // 新增：关联的原始需求ID数组
  createdAt: datetime;
  updatedAt: datetime;
}
```

### 关联类型说明

| 场景 | 示例 |
|------|------|
| 版本链 | 002 关联 [001]，002 是 001 的新版本 |
| 相关需求 | 002 关联 [003]，都涉及登录模块 |
| 冲突需求 | 002 关联 [004]，但标注为冲突关系 |

---

## 7. API 设计

### 7.1 添加关联

```http
POST /api/raw-requirements/:id/related
```

**请求**
```json
{
  "relatedIds": ["uuid1", "uuid2"],
  "type": "supersedes"  // supersedes / relates_to
}
```

### 7.2 获取关联列表

```http
GET /api/raw-requirements/:id/related
```

**响应**
```json
{
  "code": 0,
  "data": [
    { "id": "uuid", "content": "...", "type": "supersedes" }
  ]
}
```

### 7.3 AI 关联建议

```http
POST /api/ai/raw-requirements/:id/suggest-relations
```

---

**上一 Sprint**: [Sprint 13](sprint-13-refactor-user-role-relation.md)  
**下一 Sprint**: [Sprint 15](sprint-15-requirement-change-handling.md)