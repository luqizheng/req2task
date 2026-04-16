# 前端开发计划

## 1. 概述

### 1.1 目标
完成 req2task 前端业务页面开发，对接后端 API，实现完整的需求管理、任务看板、AI 辅助功能。

### 1.2 当前状态

| 类别 | 状态 | 说明 |
|------|------|------|
| 基础架构 | ✅ 完成 | Vue 3 + Vite + Pinia + Vue Router + Element Plus |
| 认证模块 | ✅ 完成 | 登录/注册页面、Token 管理 |
| 用户管理 | ✅ 完成 | 用户列表页面 |
| 仪表板 | ⚠️ 待对接 | 静态页面，需对接真实数据 |
| 项目管理 | ❌ 待开发 | API + Store + 页面 |
| 需求管理 | ❌ 待开发 | API + Store + 页面 |
| 任务管理 | ❌ 待开发 | API + Store + 页面 |
| AI 功能 | ❌ 待开发 | API + Store + 页面 |

---

## 2. 技术架构

### 2.1 项目结构

```
apps/web/src/
├── api/                           # API 调用层
│   ├── axios.ts                   # Axios 实例配置
│   ├── auth.ts                    # 认证 API (已有)
│   ├── projects.ts                # 项目 API
│   ├── feature-modules.ts         # 功能模块 API
│   ├── requirements.ts             # 需求 API
│   ├── tasks.ts                   # 任务 API
│   └── ai.ts                      # AI API
│
├── stores/                        # Pinia 状态管理
│   ├── user.ts                    # 用户状态 (已有)
│   ├── project.ts                 # 项目状态
│   ├── requirement.ts             # 需求状态
│   ├── task.ts                    # 任务状态
│   └── ai.ts                      # AI 状态
│
├── views/                         # 页面视图
│   ├── HomeView.vue               # 首页 (已有)
│   ├── LoginView.vue               # 登录 (已有)
│   ├── RegisterView.vue           # 注册 (已有)
│   ├── DashboardView.vue          # 仪表板 (待对接)
│   ├── UserManageView.vue          # 用户管理 (已有)
│   │
│   ├── projects/                  # 项目模块
│   │   ├── ProjectListView.vue    # 项目列表
│   │   └── ProjectDetailView.vue  # 项目详情
│   │
│   ├── requirements/              # 需求模块
│   │   ├── RequirementListView.vue # 需求列表
│   │   ├── RequirementDetailView.vue # 需求详情
│   │   └── RequirementChatView.vue # 需求对话
│   │
│   ├── tasks/                     # 任务模块
│   │   ├── TaskBoardView.vue      # 任务看板
│   │   └── TaskDetailView.vue     # 任务详情
│   │
│   └── ai/                        # AI 模块
│       ├── AiGenerateView.vue     # AI 生成
│       └── AiConfigView.vue       # AI 配置
│
├── components/                    # 通用组件
│   ├── common/                    # 通用组件
│   ├── layout/                    # 布局组件 (已有)
│   ├── projects/                  # 项目组件
│   ├── requirements/              # 需求组件
│   ├── tasks/                    # 任务组件
│   └── ai/                       # AI 组件
│
├── composables/                   # 组合式函数
│   ├── useProjects.ts
│   ├── useRequirements.ts
│   ├── useTasks.ts
│   └── useAI.ts
│
└── router/
    └── index.ts                   # 路由配置 (待更新)
```

### 2.2 路由规划

| 路径 | 页面 | 权限 | 说明 |
|------|------|------|------|
| `/` | HomeView | 公开 | 首页 |
| `/login` | LoginView | 公开 | 登录 |
| `/register` | RegisterView | 公开 | 注册 |
| `/dashboard` | DashboardView | 登录 | 仪表板 |
| `/users` | UserManageView | 登录 | 用户管理 |
| `/projects` | ProjectListView | 登录 | 项目列表 |
| `/projects/:id` | ProjectDetailView | 登录 | 项目详情 |
| `/projects/:projectId/modules/:moduleId/requirements` | RequirementListView | 登录 | 需求列表 |
| `/requirements/:id` | RequirementDetailView | 登录 | 需求详情 |
| `/requirements/:id/chat` | RequirementChatView | 登录 | 需求对话 |
| `/requirements/:requirementId/tasks` | TaskBoardView | 登录 | 任务看板 |
| `/tasks/:id` | TaskDetailView | 登录 | 任务详情 |
| `/ai/generate` | AiGenerateView | 登录 | AI 生成 |
| `/ai/config` | AiConfigView | 登录 | AI 配置 |

---

## 3. API 对接规范

### 3.1 项目 API (projects.ts)

```typescript
// 后端接口
GET    /projects                    // 列表 (分页)
GET    /projects/:id                // 详情
GET    /projects/key/:projectKey    // 按 Key 查找
POST   /projects                    // 创建
PUT    /projects/:id                // 更新
DELETE /projects/:id                // 删除
GET    /projects/:id/members        // 成员列表
POST   /projects/:id/members        // 添加成员
DELETE /projects/:id/members/:userId // 移除成员
```

### 3.2 功能模块 API (feature-modules.ts)

```typescript
// 后端接口
GET    /projects/:projectId/feature-modules      // 列表
GET    /feature-modules/:id                      // 详情
POST   /projects/:projectId/feature-modules      // 创建
PUT    /feature-modules/:id                      // 更新
DELETE /feature-modules/:id                      // 删除
```

### 3.3 需求 API (requirements.ts)

```typescript
// 后端接口
GET    /requirements/modules/:moduleId/requirements     // 按模块列表
GET    /requirements/:id                              // 详情
POST   /requirements/modules/:moduleId/requirements  // 创建
PUT    /requirements/:id                             // 更新
DELETE /requirements/:id                             // 删除
POST   /requirements/:id/transition                  // 状态流转
GET    /requirements/:id/allowed-transitions         // 允许的状态
GET    /requirements/:id/change-history              // 变更历史
POST   /requirements/:id/review                      // 评审

// 用户故事
POST   /user-stories/:requirementId/user-stories      // 创建
GET    /user-stories/:requirementId/user-stories      // 列表
PUT    /user-stories/:id                              // 更新
DELETE /user-stories/:id                              // 删除

// 验收条件
POST   /acceptance-criteria/:userStoryId/acceptance-criteria // 创建
GET    /acceptance-criteria/:userStoryId/acceptance-criteria // 列表
PUT    /acceptance-criteria/:id                      // 更新
DELETE /acceptance-criteria/:id                      // 删除
```

### 3.4 任务 API (tasks.ts)

```typescript
// 后端接口
GET    /requirements/:requirementId/tasks           // 按需求列表
GET    /requirements/:requirementId/kanban          // 看板视图
GET    /requirements/:requirementId/task-statistics // 任务统计
GET    /tasks/:id                                    // 详情
POST   /requirements/:requirementId/tasks            // 创建
PUT    /tasks/:id                                    // 更新
DELETE /tasks/:id                                    // 删除
POST   /tasks/:id/transition                        // 状态流转
GET    /tasks/:id/allowed-transitions               // 允许的状态
POST   /tasks/:id/dependencies                      // 添加依赖
DELETE /tasks/:id/dependencies/:dependencyTaskId    // 移除依赖
```

### 3.5 AI API (ai.ts)

```typescript
// 后端接口
// LLM 配置
GET    /ai/llm-configs                    // 配置列表
GET    /ai/llm-configs/:id                // 详情
POST   /ai/llm-configs                    // 创建
PUT    /ai/llm-configs/:id                // 更新
DELETE /ai/llm-configs/:id                // 删除

// AI 对话
POST   /ai/chat                           // 通用对话
POST   /ai/ai-chat                        // 带上下文的对话

// 需求生成
POST   /ai/generate-requirement           // 生成需求
POST   /ai/generate-user-stories          // 生成用户故事
POST   /ai/generate-acceptance-criteria   // 生成验收条件

// 原始需求
POST   /ai/modules/:moduleId/raw-requirements           // 创建
GET    /ai/modules/:moduleId/raw-requirements           // 列表
POST   /ai/raw-requirements/:id/generate               // 从原始需求生成

// 冲突检测
POST   /ai/raw-requirements/:id/detect-conflicts       // 检测冲突
GET    /ai/semantic-search                              // 语义检索

// 任务分解
POST   /ai/decompose-requirement                        // 分解需求
POST   /ai/estimate-workload                            // 估算工时
POST   /ai/tasks/:id/generate-subtasks                  // 生成子任务

// 相似推荐
GET    /ai/similar-requirements                         // 相似需求

// 向量存储
GET    /ai/vector-store/search                          // 检索
POST   /ai/vector-store/add                             // 添加

// 提示词模板
GET    /ai/prompt-templates                             // 获取模板
```

---

## 4. Sprint 详细规划

### Sprint 1：项目与模块管理 (1周)

#### 目标
实现项目列表、详情、成员管理功能模块。

#### 任务

| 任务 | 预估 | 优先级 |
|------|------|--------|
| API: projects.ts | 4h | P0 |
| API: feature-modules.ts | 4h | P0 |
| Store: project.ts | 6h | P0 |
| ProjectListView.vue | 8h | P0 |
| ProjectDetailView.vue | 8h | P0 |
| 项目组件封装 | 4h | P1 |

#### 验收标准
- [ ] 可查看项目列表
- [ ] 可创建/编辑/删除项目
- [ ] 可查看项目详情
- [ ] 可管理项目成员

---

### Sprint 2：需求管理基础 (1周)

#### 目标
实现需求列表、详情、用户故事、验收条件管理。

#### 任务

| 任务 | 预估 | 优先级 |
|------|------|--------|
| API: requirements.ts | 6h | P0 |
| Store: requirement.ts | 8h | P0 |
| RequirementListView.vue | 8h | P0 |
| RequirementDetailView.vue | 8h | P0 |
| 用户故事编辑组件 | 4h | P0 |
| 验收条件编辑组件 | 4h | P0 |

#### 验收标准
- [ ] 可按模块查看需求列表
- [ ] 可创建/编辑/删除需求
- [ ] 可添加/编辑用户故事
- [ ] 可添加/编辑验收条件

---

### Sprint 3：需求状态与工作流 (1周)

#### 目标
实现需求状态流转、变更历史、评审功能。

#### 任务

| 任务 | 预估 | 优先级 |
|------|------|--------|
| 需求状态流转组件 | 6h | P0 |
| 变更历史展示组件 | 4h | P0 |
| 需求评审组件 | 4h | P0 |
| 需求详情页面完善 | 6h | P0 |
| Store: requirement.ts 完善 | 4h | P1 |

#### 验收标准
- [ ] 可流转需求状态
- [ ] 可查看变更历史
- [ ] 可进行需求评审

---

### Sprint 4：任务管理 (1周)

#### 目标
实现任务列表、看板视图、任务详情。

#### 任务

| 任务 | 预估 | 优先级 |
|------|------|--------|
| API: tasks.ts | 6h | P0 |
| Store: task.ts | 8h | P0 |
| TaskBoardView.vue | 12h | P0 |
| TaskDetailView.vue | 8h | P0 |
| 任务依赖组件 | 4h | P1 |

#### 验收标准
- [ ] 可查看任务看板
- [ ] 可创建/编辑/删除任务
- [ ] 可拖拽更新任务状态
- [ ] 可管理任务依赖

---

### Sprint 5：AI 配置与对话 (1周)

#### 目标
实现 AI 配置管理、通用对话功能。

#### 任务

| 任务 | 预估 | 优先级 |
|------|------|--------|
| API: ai.ts | 8h | P0 |
| Store: ai.ts | 6h | P0 |
| AiConfigView.vue | 8h | P0 |
| AI Chat 组件 | 8h | P0 |
| AiGenerateView.vue | 6h | P0 |

#### 验收标准
- [ ] 可配置 LLM
- [ ] 可进行 AI 对话
- [ ] 可切换 AI 配置

---

### Sprint 6：AI 需求生成 (1周)

#### 目标
实现 AI 需求生成、用户故事生成、验收条件生成。

#### 任务

| 任务 | 预估 | 优先级 |
|------|------|--------|
| 原始需求输入组件 | 4h | P0 |
| 需求生成结果展示 | 6h | P0 |
| 用户故事生成组件 | 4h | P0 |
| 验收条件生成组件 | 4h | P0 |
| 生成结果编辑/保存 | 6h | P0 |

#### 验收标准
- [ ] 可输入原始需求
- [ ] 可 AI 生成结构化需求
- [ ] 可生成用户故事
- [ ] 可生成验收条件

---

### Sprint 7：AI 冲突检测与分解 (1周)

#### 目标
实现冲突检测、任务分解、相似推荐。

#### 任务

| 任务 | 预估 | 优先级 |
|------|------|--------|
| 冲突检测展示组件 | 6h | P0 |
| 语义检索结果组件 | 4h | P0 |
| 任务分解展示 | 6h | P0 |
| 相似需求推荐 | 4h | P0 |
| RequirementChatView.vue | 8h | P0 |

#### 验收标准
- [ ] 可检测需求冲突
- [ ] 可查看相似需求
- [ ] 可 AI 分解任务
- [ ] 需求对话界面正常

---

### Sprint 8：仪表板与集成 (1周)

#### 目标
完善仪表板对接、路由整合、整体优化。

#### 任务

| 任务 | 预估 | 优先级 |
|------|------|--------|
| DashboardView 对接真实 API | 8h | P0 |
| 路由整合与权限控制 | 6h | P0 |
| 布局组件完善 | 4h | P0 |
| 全局错误处理 | 4h | P1 |
| 加载状态优化 | 4h | P1 |

#### 验收标准
- [ ] 仪表板数据真实展示
- [ ] 路由导航正常
- [ ] 权限控制生效

---

### Sprint 9-10：高级功能与优化 (2周)

#### 目标
实现高级功能、性能优化、测试完善。

#### 任务

| 任务 | 预估 | 优先级 |
|------|------|--------|
| 项目进度看板 | 8h | P1 |
| 基线管理界面 | 8h | P1 |
| 通知组件 | 6h | P2 |
| 性能优化 | 8h | P1 |
| E2E 测试完善 | 8h | P1 |
| 响应式适配 | 6h | P1 |

#### 验收标准
- [ ] 项目进度可视化
- [ ] 可创建/恢复基线
- [ ] 响应式布局正常

---

## 5. 里程碑

| 里程碑 | Sprint | 交付内容 | 验收标准 |
|--------|--------|----------|----------|
| M1 | Sprint 2 | 项目+需求管理 | 可 CRUD 项目和需求 |
| M2 | Sprint 4 | 任务看板 | 看板视图可用，状态流转正常 |
| M3 | Sprint 6 | AI 生成 | 可 AI 生成需求、用户故事 |
| M4 | Sprint 7 | AI 检测 | 冲突检测、任务分解可用 |
| M5 | Sprint 10 | 完整系统 | 所有页面可用，响应式正常 |

---

## 6. 组件清单

### 6.1 通用组件

| 组件 | 说明 |
|------|------|
| StatusTag | 状态标签组件 |
| PriorityTag | 优先级标签 |
| UserAvatar | 用户头像 |
| EmptyState | 空状态提示 |
| LoadingSkeleton | 加载骨架屏 |
| ConfirmDialog | 确认对话框 |

### 6.2 项目组件

| 组件 | 说明 |
|------|------|
| ProjectCard | 项目卡片 |
| ProjectForm | 项目表单 |
| MemberList | 成员列表 |
| MemberSelect | 成员选择器 |

### 6.3 需求组件

| 组件 | 说明 |
|------|------|
| RequirementCard | 需求卡片 |
| RequirementForm | 需求表单 |
| UserStoryEditor | 用户故事编辑器 |
| AcceptanceCriteriaList | 验收条件列表 |
| StatusTransition | 状态流转组件 |
| ChangeHistory | 变更历史 |

### 6.4 任务组件

| 组件 | 说明 |
|------|------|
| TaskCard | 任务卡片 |
| TaskForm | 任务表单 |
| KanbanColumn | 看板列 |
| DependencyGraph | 依赖关系图 |

### 6.5 AI 组件

| 组件 | 说明 |
|------|------|
| ChatMessage | 聊天消息 |
| ChatInput | 聊天输入框 |
| RequirementGenerator | 需求生成器 |
| ConflictResult | 冲突结果展示 |
| SimilarList | 相似列表 |

---

## 7. 技术规范

### 7.1 页面文件限制
- `.vue` 单文件不超过 500 行
- 超过需拆分组件

### 7.2 API 调用规范
```typescript
// 使用统一封装
import api from '@/api/axios'

// 请求示例
const fetchProjects = async () => {
  try {
    const { data } = await api.get('/projects')
    return data
  } catch (error) {
    ElMessage.error('获取项目列表失败')
    throw error
  }
}
```

### 7.3 Store 规范
```typescript
// 使用组合式 API
export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const loading = ref(false)

  const fetchProjects = async () => {
    loading.value = true
    // ...
    loading.value = false
  }

  return { projects, loading, fetchProjects }
})
```

### 7.4 错误处理
- API 错误统一在 axios 拦截器处理
- 业务错误使用 ElMessage 提示
- 关键操作使用 ConfirmDialog 确认

---

## 8. 依赖关系图

```
┌─────────────────────────────────────────────────────────┐
│                      路由层                              │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                     视图层                               │
│  ProjectList │ RequirementList │ TaskBoard │ AiGenerate │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                     Store 层                             │
│    useProject    │ useRequirement │ useTask │ useAI    │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                      API 层                              │
│   projects │ requirements │ tasks │ ai │ auth          │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                   后端服务                                │
│  ProjectsService │ RequirementsService │ TasksService   │
└─────────────────────────────────────────────────────────┘
```
