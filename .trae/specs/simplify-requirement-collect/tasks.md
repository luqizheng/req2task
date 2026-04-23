# Tasks
- [x] Task 1: 重写 RequirementChatPanel 为简化输入面板
  - [x] SubTask 1.1: 移除 AIChat 组件引用
  - [x] SubTask 1.2: 创建简单的文本输入框（多行文本域）
  - [x] SubTask 1.3: 添加需求文件上传 UI（会议录音、文档等）
  - [x] SubTask 1.4: 添加项目附件上传 UI
  - [x] SubTask 1.5: 实现提交功能
- [x] Task 2: 简化 requirementCollectStore
  - [x] SubTask 2.1: 移除 chatHistory 相关状态
  - [x] SubTask 2.2: 移除 sendMessage、continueChat 方法
  - [x] SubTask 2.3: 移除 chatWithCollection API 调用
  - [x] SubTask 2.4: 移除 isSending 状态
- [x] Task 3: 简化前端 API (requirementCollection.ts)
  - [x] SubTask 3.1: 移除 chatWithCollection 方法
  - [x] SubTask 3.2: 移除 analyzeRequirement 方法（非 stream）
  - [x] SubTask 3.3: 扩展 streamAnalyzeRequirement 请求体
- [x] Task 4: 简化后端 controller
  - [x] SubTask 4.1: 删除 chatWithCollection 方法 (L146-186)
  - [x] SubTask 4.2: 删除 streamChatWithCollection 方法 (L188-271)
  - [x] SubTask 4.3: 删除 analyzeRequirement 方法 (L273-285)
  - [x] SubTask 4.4: 扩展 analyzeRequirementStream 方法的请求体
- [x] Task 5: 更新 RawRequirementCollectView 布局
  - [x] SubTask 5.1: 调整左右面板宽度比例
  - [x] SubTask 5.2: 移除不再需要的 import

# Task Dependencies
- Task 1 完成后才可开始 Task 5
- Task 2、Task 3、Task 4 可并行执行
