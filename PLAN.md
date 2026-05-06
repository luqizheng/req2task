# 重构 RequirementTasks.vue - 移除 UnSavedTask 类型

## 目标
将 `unsavedTasks` 和 `tasks` 合并为一个数组，通过 `id` 是否有值判断任务是否已保存。

## 修改内容

### 1. 移除 UnSavedTask 类型定义
删除第 31-43 行的 `UnSavedTask` 接口。

### 2. 合并任务数组
- 将 `unsavedTasks` 合并到 `tasks` 中
- 统一使用 `TaskResponseDto` 类型
- 未保存任务: `id` 为空/null
- 已保存任务: `id` 有值

### 3. 简化函数签名
- `handleSaveTask`: 接收完整 task，保存后更新 id
- `handleDeleteTask`: 根据 id 判断来源（已保存/未保存）
- `startEditingTask` / `saveEditTask` / `cancelEditTask`: 操作同数组
- `saveTask`: 合并编辑和保存逻辑

### 4. 清理模板
- 统一模板中的任务渲染逻辑
- 已保存任务: 显示状态 Badge
- 未保存任务: 显示 "未保存" Badge，taskNo 使用生成的临时值
