# Tasks: AI 生成 Title 功能

## 阶段 1: DTO 定义
- [ ] Task: 添加 GenerateTitle DTOs
  - Acceptance: packages/dto/src/ai/dto/ai.dto.ts 包含 GenerateTitleRequestDto 和 GenerateTitleResponseDto
  - Verify: 检查 DTO 文件编译无误
  - Files: packages/dto/src/ai/dto/ai.dto.ts

## 阶段 2: 后端实现
- [ ] Task: AI Service 添加 generateTitle 方法
  - Acceptance: ai.service.ts 中有 generateTitle 方法，能调用 LLM 生成标题
  - Verify: 单元测试通过
  - Files: apps/service/src/ai/ai.service.ts

- [ ] Task: AI Controller 添加 /ai/generate-title 端点
  - Acceptance: 控制器有新端点，返回 SSE 流
  - Verify: API 测试通过
  - Files: apps/service/src/ai/ai.controller.ts

## 阶段 3: 前端实现
- [ ] Task: useRequirementSubmit.ts 添加 generateTitle 方法
  - Acceptance: 有 generateTitle 方法，调用后端 SSE API
  - Verify: 手动测试 API 调用成功
  - Files: apps/web/src/views/RawRequirementEditor/useRequirementSubmit.ts

- [ ] Task: RawRequirementEditor.vue 添加 title 输入框和 magic 按钮
  - Acceptance: 表单显示 title 输入框，右侧有 magic 按钮，按钮在 content 为空时禁用
  - Verify: UI 显示正常，交互逻辑正确
  - Files: apps/web/src/views/RawRequirementEditor/RawRequirementEditor.vue

- [ ] Task: 添加表单验证规则
  - Acceptance: title 字段有适当的验证规则
  - Verify: 表单验证正常工作
  - Files: apps/web/src/views/RawRequirementEditor/RawRequirementEditor.vue

## 阶段 4: 验证
- [ ] Task: 运行 lint 检查
  - Acceptance: pnpm lint 无错误
  - Verify: 命令执行成功

- [ ] Task: 运行类型检查
  - Acceptance: pnpm type-check 无错误
  - Verify: 命令执行成功

- [ ] Task: 手动功能测试
  - Acceptance: 完整流程工作正常
  - Verify: 
    - 输入原始内容
    - 点击 magic 按钮生成 title
    - 保存后 title 正确存储
