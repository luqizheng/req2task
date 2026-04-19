# 智能追问功能实施任务

## 阶段一：数据模型

### 1.1 创建 Conversation 实体
- [ ] 在 `packages/core/src/entities/` 创建 `conversation.entity.ts`
- [ ] 实现 `Conversation` 实体类
- [ ] 实现 `ConversationStatus` 枚举
- [ ] 配置与 `RawRequirementCollection` 的多对一关系
- [ ] 配置与 `RawRequirement` 的多对一关系

### 1.2 创建 ConversationMessage 实体
- [ ] 在 `packages/core/src/entities/` 创建 `conversation-message.entity.ts`
- [ ] 实现 `ConversationMessage` 实体类
- [ ] 实现 `MessageRole` 枚举
- [ ] 配置与 `Conversation` 的一对多关系（级联删除）
- [ ] 配置与 `RawRequirement` 的多对一关系（可选）

### 1.3 修改现有实体
- [ ] 修改 `RawRequirement` 实体
  - [ ] 移除 `sessionHistory` 字段
  - [ ] 移除 `followUpQuestions` 字段
  - [ ] 新增 `conversationId` 字段
  - [ ] 新增 `conversation` 关系
- [ ] 修改 `RawRequirementCollection` 实体
  - [ ] 新增 `mainConversationId` 字段
  - [ ] 新增 `mainConversation` 关系

### 1.4 更新实体导出
- [ ] 在 `packages/core/src/entities/index.ts` 导出新实体

### 1.5 数据库迁移
- [ ] 生成迁移文件 `add_conversations_table`
- [ ] 执行迁移验证
- [ ] 测试回滚流程

## 阶段二：提示词管理

### 2.1 更新提示词接口
- [ ] 在 `prompt.interface.ts` 新增 `conversation` 类别

### 2.2 创建对话提示词
- [ ] 在 `packages/core/src/prompts/` 创建 `conversation.prompts.ts`
- [ ] 实现 `INTELLIGENT_FOLLOW_UP` 提示词
- [ ] 实现 `MULTI_REQUIREMENT_EXTRACTION` 提示词
- [ ] 实现 `CONVERSATION_SUMMARY` 提示词

### 2.3 更新提示词服务
- [ ] 在 `prompt.service.ts` 加载新提示词
- [ ] 在 `packages/core/src/prompts/index.ts` 导出新模块

## 阶段三：服务层

### 3.1 创建 ConversationService
- [ ] 在 `packages/core/src/services/` 创建 `conversation.service.ts`
- [ ] 实现 `createConversation` 方法
- [ ] 实现 `sendMessage` 方法（核心逻辑）
- [ ] 实现 `getConversation` 方法
- [ ] 实现 `getMessages` 方法（分页）
- [ ] 实现 `updateConversation` 方法
- [ ] 实现 `completeConversation` 方法

### 3.2 实现智能追问逻辑
- [ ] 实现对话历史收集
- [ ] 实现 `INTELLIGENT_FOLLOW_UP` 调用
- [ ] 实现 `MULTI_REQUIREMENT_EXTRACTION` 调用
- [ ] 实现追问问题解析
- [ ] 实现需求自动提取

### 3.3 更新 DTO
- [ ] 在 `packages/dto/` 创建对话相关 DTO
- [ ] 创建 `CreateConversationDto`
- [ ] 创建 `SendMessageDto`
- [ ] 创建 `ConversationResponse`
- [ ] 创建 `ConversationMessageResponse`

### 3.4 服务导出
- [ ] 在 `packages/core/src/services/index.ts` 导出新服务

## 阶段四：API 层

### 4.1 创建 Conversation 控制器
- [ ] 在后端创建 `conversation.controller.ts`
- [ ] 实现 `POST /conversations` 创建会话
- [ ] 实现 `GET /conversations/:id` 获取会话
- [ ] 实现 `POST /conversations/:id/messages` 发送消息
- [ ] 实现 `GET /conversations/:id/messages` 获取消息列表
- [ ] 实现 `PATCH /conversations/:id` 更新会话

### 4.2 API 路由注册
- [ ] 在模块中注册控制器
- [ ] 配置 API 前缀和路由

### 4.3 API 文档
- [ ] 添加 Swagger/OpenAPI 装饰器
- [ ] 编写 API 使用示例

## 阶段五：前端 API 客户端

### 5.1 创建 API 模块
- [ ] 在 `apps/web/src/api/` 创建 `conversation.ts`
- [ ] 实现类型定义
- [ ] 实现 API 方法

### 5.2 创建状态管理
- [ ] 在 `apps/web/src/stores/` 创建 `conversation.ts`
- [ ] 实现 `useConversationStore`
- [ ] 实现对话状态管理
- [ ] 实现消息持久化同步

### 5.3 更新现有 store
- [ ] 修改 `requirementCollect.ts`
- [ ] 移除旧的 `chatHistory` 管理
- [ ] 集成新的 `ConversationService`

## 阶段六：前端组件

### 6.1 重构 RequirementChatPanel
- [ ] 重命名组件为 `ConversationPanel.vue`
- [ ] 集成新的对话状态管理
- [ ] 更新消息列表渲染
- [ ] 更新追问问题展示

### 6.2 创建子组件
- [ ] 创建 `ChatMessageList.vue`
- [ ] 创建 `UserMessage.vue`
- [ ] 创建 `AssistantMessage.vue`
- [ ] 创建 `FollowUpQuestionList.vue`

### 6.3 更新视图
- [ ] 修改 `RawRequirementCollectView.vue`
- [ ] 移除旧的 chatHistory 引用
- [ ] 集成新的 Conversation 逻辑

### 6.4 更新类型定义
- [ ] 同步后端 DTO 类型
- [ ] 更新前端接口定义

## 阶段七：测试

### 7.1 单元测试
- [ ] 为 `ConversationService` 编写单元测试
- [ ] 测试创建会话逻辑
- [ ] 测试发送消息逻辑
- [ ] 测试多需求识别逻辑

### 7.2 集成测试
- [ ] 测试完整对话流程
- [ ] 测试数据库持久化
- [ ] 测试 API 端点

### 7.3 E2E 测试
- [ ] 测试用户对话流程
- [ ] 测试追问功能
- [ ] 测试需求识别

## 阶段八：文档与配置

### 8.1 文档更新
- [ ] 更新 `docs/design/database-design.md`
- [ ] 更新 API 规范文档
- [ ] 更新用户手册

### 8.2 配置项
- [ ] 添加追问配置常量
- [ ] 配置追问上限
- [ ] 配置摘要触发阈值

## 任务依赖关系

```
阶段一（数据模型）
    ↓
阶段二（提示词） ← 依赖阶段一的部分类型
    ↓
阶段三（服务层） ← 依赖阶段一、二
    ↓
阶段四（API层） ← 依赖阶段三
    ↓
阶段五（前端API） ← 依赖阶段四
    ↓
阶段六（前端组件） ← 依赖阶段五
    ↓
阶段七（测试） ← 依赖所有阶段
    ↓
阶段八（文档） ← 依赖所有阶段
```

## 预估任务点

| 阶段 | 任务数 | 优先级 |
|------|--------|--------|
| 数据模型 | 5 | P0 |
| 提示词 | 3 | P0 |
| 服务层 | 4 | P0 |
| API 层 | 3 | P1 |
| 前端 API | 2 | P1 |
| 前端组件 | 4 | P1 |
| 测试 | 3 | P2 |
| 文档 | 2 | P2 |
