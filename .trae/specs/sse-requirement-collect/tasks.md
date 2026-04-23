# Tasks

## 任务清单

### 阶段 1: DTO 定义

- [x] Task 1.1: 创建 CollectRequirementDto
  - 在 `packages/dto/src/raw-requirement/` 创建 `collect-requirement.dto.ts`
  - 定义 `CollectRequirementDto` 接口
  - 导出类型

### 阶段 2: 服务层

- [ ] Task 2.1: 创建 RequirementCollectService
  - 在 `apps/service/src/raw-requirement/` 创建 `requirement-collect.service.ts`
  - 实现 `collect()` 方法处理 SSE 请求
  - 实现音频转写调用
  - 实现 AI 对话流式响应转发
  - 实现附件关联

- [x] Task 2.2: 添加 FileConversionService 客户端
  - 在 `apps/service/src/common/services/` 创建 `file-conversion-client.service.ts`
  - 实现 `transcribeAudio()` 方法

### 阶段 3: 控制器

- [x] Task 3.1: 更新 RawRequirementController
  - 删除 `chatCollect` 方法（第 53-78 行）
  - 删除 `streamChatCollect` 方法（第 80-161 行）
  - 新增 `collect` SSE 接口

### 阶段 4: 依赖注入

- [x] Task 4.1: 更新 RawRequirementModule
  - 导入 `HttpModule`（用于调用 file-conversion）
  - 注册 `RequirementCollectService`

### 阶段 5: 测试

- [x] Task 5.1: 编写 RequirementCollectService 测试
  - 测试纯文字收集流程
  - 测试带音频收集流程
  - 测试带附件收集流程

## 任务依赖

```
Task 1.1
   ↓
Task 2.1 ← Task 1.1, Task 2.2
Task 2.2
   ↓
Task 3.1 ← Task 2.1, Task 2.2
   ↓
Task 4.1 ← Task 3.1
   ↓
Task 5.1 ← Task 4.1
```
