# 前端开发路线图

**文档版本**: v1.0
**最后更新**: 2026-04-17
**状态**: 🚧 进行中
**里程碑**: M6 (对接后端 Sprint 13-15)

---

## 1. 概述

本文档规划 req2task 前端在 M6 阶段（M5 后）需要完成的功能开发，与后端 Sprint 13-15 对齐。

### 1.1 前端现状

| 类别 | 数量 | 说明 |
|------|------|------|
| 页面 | 19 | 基础 CRUD + AI 功能 |
| Store | 7 | user, project, requirement, task, ai 等 |
| API 模块 | 9 | auth, projects, requirements, tasks, ai 等 |
| 组件 | 5 | layout + 4 project 业务组件 |

### 1.2 缺失项

| 类型 | 缺失项 | 优先级 |
|------|--------|--------|
| Store | userStory, acceptanceCriteria, rawRequirement, llmConfig | P0 |
| 页面 | RawRequirementCollectView, UserStoryManageView | P0 |
| 组件 | 通用组件库 (8+), 业务组件 (4+) | P1 |
| 功能 | 权限管理 UI, 通知面板, 提示词模板管理 | P2 |

---

## 2. Sprint 规划

### Sprint 11: 核心 Store 与页面

**目标**: 补齐缺失的 Store 和页面
**预计时长**: 1 周
**状态**: 🚧 进行中
**里程碑**: M6

#### 2.1 任务列表

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| userStory Store | store | 4h | P0 | ⏳ |
| acceptanceCriteria Store | store | 4h | P0 | ⏳ |
| rawRequirement Store | store | 4h | P0 | ⏳ |
| llmConfig Store | store | 4h | P0 | ⏳ |
| RawRequirementCollectView | page | 8h | P0 | ⏳ |
| UserStoryManageView | page | 4h | P0 | ⏳ |
| 升级 AiConfigView (LLM CRUD) | page | 4h | P1 | ⏳ |
| API 补充 (user-stories, acceptance-criteria, raw-requirements, llm) | api | 4h | P0 | ⏳ |

**总预估工时**: 36h (约 4.5 人天)

#### 2.2 Store 设计

```typescript
// stores/userStory.ts
interface UserStoryState {
  userStories: UserStory[]
  currentStory: UserStory | null
  loading: boolean
}

// stores/acceptanceCriteria.ts
interface AcceptanceCriteriaState {
  criteriaList: AcceptanceCriteria[]
  loading: boolean
}

// stores/rawRequirement.ts
interface RawRequirementState {
  collections: RawCollection[]
  requirements: RawRequirement[]
  loading: boolean
}

// stores/llmConfig.ts
interface LLMConfigState {
  configs: LLMConfig[]
  currentConfig: LLMConfig | null
  loading: boolean
}
```

#### 2.3 页面设计

**RawRequirementCollectView**
```
┌─────────────────────────────────────────┐
│ 原始需求收集                             │
├─────────────────────────────────────────┤
│ [收集列表]  │  [收集详情]                 │
│ - 收集1    │  - 原始需求列表             │
│ - 收集2    │  - AI 转换为需求            │
│ + 新建收集 │  - 批量导入                │
└─────────────────────────────────────────┘
```

**UserStoryManageView**
```
┌─────────────────────────────────────────┐
│ 用户故事管理                             │
├─────────────────────────────────────────┤
│ 需求选择: [dropdown]                     │
│ ┌─────────────────────────────────────┐  │
│ │ Role: 作为管理员                     │  │
│ │ Goal: 我想要...                      │  │
│ │ Benefit: 以便于...                   │  │
│ │ [验收条件列表]                       │  │
│ └─────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

#### 2.4 验收标准

- [ ] 4 个新 Store 可正常使用
- [ ] RawRequirementCollectView 可创建收集、添加原始需求
- [ ] UserStoryManageView 可管理用户故事
- [ ] API 对接完成

---

### Sprint 12: 组件体系

**目标**: 建立通用组件库和业务组件
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M6

#### 2.5 任务列表

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| Button 组件扩展 | component | 2h | P1 | ⏳ |
| Card 组件扩展 | component | 2h | P1 | ⏳ |
| Table 组件封装 | component | 4h | P1 | ⏳ |
| Form 组件封装 | component | 4h | P1 | ⏳ |
| Modal 组件封装 | component | 2h | P1 | ⏳ |
| Tag/Badge 组件 | component | 2h | P1 | ⏳ |
| Avatar 组件 | component | 1h | P2 | ⏳ |
| RequirementCard | component | 4h | P1 | ⏳ |
| TaskCard | component | 4h | P1 | ⏳ |
| MemberSelect | component | 3h | P1 | ⏳ |
| PriorityTag | component | 2h | P1 | ⏳ |
| 组件文档编写 | docs | 4h | P2 | ⏳ |

**总预估工时**: 36h (约 4.5 人天)

#### 2.6 组件目录结构

```
src/components/
├── common/           # 通用组件
│   ├── AppButton.vue
│   ├── AppCard.vue
│   ├── AppTable.vue
│   ├── AppForm.vue
│   ├── AppModal.vue
│   ├── AppTag.vue
│   ├── AppBadge.vue
│   └── AppAvatar.vue
├── business/         # 业务组件
│   ├── RequirementCard.vue
│   ├── TaskCard.vue
│   ├── MemberSelect.vue
│   └── PriorityTag.vue
└── layout/          # 布局组件 (已有)
```

#### 2.7 验收标准

- [ ] 通用组件库可复用
- [ ] 业务组件覆盖核心场景
- [ ] 组件文档完整

---

### Sprint 13: 体验优化

**目标**: 提升用户体验，完善加载态、空状态、响应式
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M6

#### 2.8 任务列表

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| 骨架屏组件 | component | 4h | P2 | ⏳ |
| 空状态组件 | component | 3h | P2 | ⏳ |
| 错误边界处理 | feature | 4h | P2 | ⏳ |
| 路由过渡动画 | feature | 4h | P2 | ⏳ |
| 响应式适配 | feature | 8h | P2 | ⏳ |
| 页面加载优化 | perf | 4h | P2 | ⏳ |
| 重复代码抽取 | refactor | 4h | P2 | ⏳ |

**总预估工时**: 31h (约 4 人天)

#### 2.9 验收标准

- [ ] 骨架屏覆盖所有列表页面
- [ ] 空状态组件统一
- [ ] 移动端基本可用
- [ ] 路由切换有动画

---

### Sprint 14: 高级功能 - 权限与通知

**目标**: 权限管理 UI 和通知系统
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M6

#### 2.10 任务列表

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| PermissionStore | store | 4h | P1 | ⏳ |
| PermissionManageView | page | 8h | P1 | ⏳ |
| RoleManageView | page | 6h | P1 | ⏳ |
| NotificationStore | store | 4h | P2 | ⏳ |
| NotificationPanel | component | 6h | P2 | ⏳ |
| NotificationBell | component | 2h | P2 | ⏳ |
| WebSocket 集成 | feature | 6h | P2 | ⏳ |

**总预估工时**: 36h (约 4.5 人天)

#### 2.11 页面设计

**PermissionManageView**
```
┌─────────────────────────────────────────┐
│ 权限管理                                 │
├─────────────────────────────────────────┤
│ 项目: [选择项目]  成员: [选择成员]        │
│ ┌─────────────────────────────────────┐  │
│ │ 当前角色: 项目经理                    │  │
│ │ 权限列表:                            │  │
│ │ [x] 项目查看  [x] 项目编辑           │  │
│ │ [x] 需求创建  [x] 需求编辑          │  │
│ │ [x] 任务管理  [ ] 用户管理          │  │
│ │ [保存]                              │  │
│ └─────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**NotificationPanel**
```
┌─────────────────────────────────────────┐
│ 通知                                      │
├─────────────────────────────────────────┤
│ [全部] [未读] [已读]                      │
│ ┌─────────────────────────────────────┐  │
│ │ 🔔 任务分配: 张三已分配任务给你       │  │
│ │    5分钟前                    [×]   │  │
│ ├─────────────────────────────────────┤  │
│ │ 🔔 需求审批: 新需求待审核            │  │
│ │    30分钟前                   [×]   │  │
│ └─────────────────────────────────────┘  │
│                        [全部标为已读]      │
└─────────────────────────────────────────┘
```

#### 2.12 验收标准

- [ ] 权限管理 UI 可用
- [ ] 角色管理可配置
- [ ] 通知实时推送
- [ ] 通知面板功能完整

---

## 3. 技术债务

| 问题 | 解决方案 | 优先级 |
|------|----------|--------|
| API 分散 | 统一导出管理 | P2 |
| 组件复用性低 | 建立 common/business 目录 | P1 |
| 样式不统一 | Design-Rules.md 规范执行 | P1 |
| 缺少 TypeScript 类型 | 完善 @req2task/dto | P1 |

---

## 4. 里程碑

| 里程碑 | 前端 Sprint | 验收内容 |
|--------|-------------|----------|
| M5 | Sprint 10 | 基础功能完整 |
| M6 | Sprint 11-14 | 高级功能、体验优化 |

---

## 5. 风险与依赖

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 后端 API 延迟 | 前端无法对接 | 提前 Mock 数据 |
| 设计稿缺失 | 开发返工 | 复用现有 Design-Rules |
| WebSocket 实现复杂度 | 进度延迟 | 分阶段实现 |

---

**下一步**: [Sprint 11: 核心 Store 与页面](sprint-11-frontend-core-store.md)
