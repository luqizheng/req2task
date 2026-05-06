# RequirementTasks.vue 重构计划

## 需求
AI 生成任务后，任务为"未保存"状态（虚线样式），由用户决定保留或删除。

参考：`RequirementContent.vue` 的用户故事逻辑。

## 现状分析
- 后端 `streamGenerateTasks` 在 LLM 流结束后调用 `persistenceService.persistTasks()` 持久化到数据库
- 返回的 `extractedData.tasks` 包含已持久化（有真实 ID）的任务
- 前端当前把所有任务放入 `unsavedGeneratedTasks`，但后端已经保存了

## 设计决策
1. **未保存任务由前端管理** — 后端新增 `streamGenerateTasksPreview` 方法（不持久化，只返回 LLM 输出片段），前端自行决定何时保存
2. **保存时调用已有创建 API** — `tasksApi.create(requirementId, dto)` 创建任务
3. **删除未保存任务** — 仅前端移除，无需 API 调用
4. **删除已保存任务** — 调用 `tasksApi.delete(id)`

## 任务列表

### Task 1: 后端新增预览流方法

**文件**: `apps/service/src/ai/ai-generation.service.ts`

新增 `streamGenerateTasksPreview()` 方法：
- 与 `streamGenerateTasks` 相同，但不调用 `persistenceService.persistTasks()`
- 直接在 `done` 事件的 `extractedData` 中返回解析后的任务数据（不含 ID）
- 返回 `{ tasks: TaskPreview[], rawContent: string }`

```typescript
interface TaskPreview {
  taskNo: string;     // 预生成编号
  title: string;
  description: string;
  priority: string;
  estimatedHours: number;
}
```

**验收标准**:
- [ ] `streamGenerateTasksPreview` 方法存在且返回 Observable
- [ ] done 事件包含 `extractedData.tasks`（不含 id 字段）

---

### Task 2: 后端新增 Controller 端点

**文件**: `apps/service/src/tasks/tasks.controller.ts`

新增 `POST /requirements/:requirementId/ai-generate-tasks-preview` 端点：
- 调用 `streamGenerateTasksPreview()`
- SSE 流式返回
- 请求体同现有端点

**验收标准**:
- [ ] 新端点可访问
- [ ] 返回 SSE 流

---

### Task 3: 前端更新 SSE URL 和任务类型

**文件**: `apps/web/src/views/RequirementDetailView/components/RequirementTasks.vue`

1. 定义 `UnSavedTask` 类型（无 id，有 tempId）
2. `sseStream` URL 改为 `/api/requirements/:id/ai-generate-tasks-preview`
3. `handleGenerateTasks` 中生成 tempId 并赋值给每个任务

```typescript
interface UnSavedTask {
  tempId: string;
  taskNo: string;
  title: string;
  description: string;
  priority: string;
  estimatedHours: number;
}
```

**验收标准**:
- [ ] 使用新的预览端点
- [ ] 生成的任务有 tempId，无真实 id

---

### Task 4: 新增保存和删除处理器

**文件**: `apps/web/src/views/RequirementDetailView/components/RequirementTasks.vue`

1. `handleSaveTask(task)` — 调用 `tasksApi.create()` 保存，成功后移动到 `tasks` 列表
2. `handleDeleteTask(task)` — 仅前端移除（unsaved 任务无 API 调用）

**验收标准**:
- [ ] 保存后任务出现在已保存列表
- [ ] 删除后任务从前端移除

---

### Task 5: UI 样式更新

**文件**: `apps/web/src/views/RequirementDetailView/components/RequirementTasks.vue`

1. CardHeader 标题添加"未保存"徽章计数
2. 未保存任务：虚线边框 + "未保存"徽章
3. "保留"按钮 → 保存
4. "删除"按钮仅对未保存任务显示

**验收标准**:
- [ ] 未保存任务显示虚线边框
- [ ] 已保存任务无操作按钮

---

### Task 6: 清理冗余逻辑

**文件**: `apps/web/src/views/RequirementDetailView/components/RequirementTasks.vue`

- 移除 `handleKeepTask`（合并到 `handleSaveTask`）
- 移除 `savingTaskIds`（保存过程简短不需要禁用按钮，或仅用于保存中状态）
- 移除 `tasksApi.delete` 的导入（已保存任务的删除不在此组件处理）

**验收标准**:
- [ ] 代码简洁，无冗余方法

---

## Checkpoint

- [ ] Task 1-2（后端）完成后可独立测试
- [ ] Task 3-6（前端）完成后可独立测试
- [ ] 整体流程：AI 生成 → 用户保留/删除 → 确认

## 涉及文件

| 文件 | 操作 |
|------|------|
| `apps/service/src/ai/ai-generation.service.ts` | 新增方法 |
| `apps/service/src/tasks/tasks.controller.ts` | 新增端点 |
| `apps/web/src/views/RequirementDetailView/components/RequirementTasks.vue` | 重构 |
