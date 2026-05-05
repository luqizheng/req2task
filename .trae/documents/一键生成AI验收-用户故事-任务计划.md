# 计划：RequirementActions.vue 一键生成 AI 验收/用户故事/任务

## 概述

在 `RequirementActions.vue` 中添加"一键 AI 生成"按钮，依次/并行调用三个后端 AI 生成接口，一次性创建用户故事、验收条件和开发任务。

## 提示词输出格式审查结论

三个提示词 JSON 输出与 DTO 定义**均一致**：

| 提示词 | DTO | 状态 |
|-------|-----|------|
| USER_STORY_GENERATION | CreateUserStoryDto | 字段名和类型完全匹配 |
| ACCEPTANCE_CRITERIA_GENERATION | CreateAcceptanceCriteriaDto | 字段名、类型、枚举值完全匹配 |
| TASK_BREAKDOWN | CreateTaskDto | 字段名、类型、枚举值完全匹配 |

无需修改提示词。

## 架构决策

### 调用时序

```
[用户点击"一键生成"]
        │
        ├─ 弹窗输入 featurePoints + context
        │
        ├─ Step 1: 并行调用（互不依赖）
        │   ├─ POST /requirements/:id/user-stories/generate → 用户故事列表
        │   └─ POST /llm/generation/tasks/:id → 任务列表
        │
        ├─ Step 2: 遍历用户故事（依赖 Step 1 的用户故事结果）
        │   └─ POST /llm/generation/acceptance-criteria/:userStoryId
        │
        └─ 完成后刷新

```

### 状态管理

- 用一个 `isGenerating` 布尔值控制所有按钮禁用和加载态
- 用 `generationStep` 字符串显示当前进度（"正在生成用户故事..."、"正在生成任务..."、"正在生成验收条件..."）
- 不拆分多个 loading 状态，保持简单

### 复用已有模式

- 从 `RequirementContent.vue` 复用 Dialog 输入模式（featurePoints + context）
- 从 `RequirementContent.vue` 和 `RequirementTasks.vue` 复用 API 调用方式
- 从现有代码复用 `vue-sonner` toast 通知

## 任务列表

### Task 1: RequirementActions.vue 添加一键生成 UI

- 添加"AI 一键生成"按钮，带 Sparkles 图标
- 添加 Dialog 弹窗，包含：
  - featurePoints 文本域（必填，placeholder: "请输入功能点描述"）
  - context 文本域（可选，placeholder: "请输入附加上下文"）
  - 进度提示区域（显示当前生成步骤）
- 按钮禁用条件：`isGenerating || !featurePoints.trim()`
- 使用 `Loader2` + `animate-spin` 做加载态

**涉及文件：**
- `apps/web/src/views/RequirementDetailView/components/RequirementActions.vue`

### Task 2: 实现一键生成逻辑

- 新增 `handleOneClickGenerate` 方法：
  1. 设置 `isGenerating = true`，更新步骤提示
  2. **并行**调用 `aiApi.generateUserStoriesForRequirement()` 和 `aiApi.generateTasksForRequirement()`
  3. 成功后，**遍历**生成的用户故事列表，为每个调用 `aiApi.generateAcceptanceCriteriaForUserStory()`
  4. 全部完成后 `toast.success("一键生成完成")`
  5. 错误时 `toast.error()` + 部分完成提示
  6. 关闭弹窗，emit 事件通知父组件刷新

- 新增 emit 事件：`"generated"`（父组件收到后刷新用户故事和任务列表）

**涉及文件：**
- `apps/web/src/views/RequirementDetailView/components/RequirementActions.vue`

### Task 3: 更新父组件 RequirementDetailView

- 监听 `RequirementActions` 的 `"generated"` 事件
- 刷新需求详情页的所有子组件数据（用户故事列表、任务列表）

**涉及文件：**
- `apps/web/src/views/RequirementDetailView/RequirementDetailView.vue`（需确认文件名）

## 风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| 用户故事生成数量多 → 验收条件调用次数多 | 响应慢 | 并行调用所有验收条件生成，而不是串行 |
| 部分生成失败 | 数据不完整 | 使用 `Promise.allSettled` 处理部分失败，toast 显示成功/失败计数 |
| 提示词输出格式问题 | 解析失败 | 无需修改，已确认格式一致 |

## 打开问题

1. 父组件文件名为 `RequirementDetailView.vue` 还是其他？需要确认以添加事件监听。
