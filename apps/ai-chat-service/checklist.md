# AI Chat Service 完成检查清单

## 代码完整性检查

### 依赖项
- [x] TypeORM 已安装并配置
- [x] pg 驱动已安装
- [x] reflect-metadata 已安装
- [x] pino 日志库已安装
- [x] dotenv 已安装

### 配置模块
- [x] `src/config/index.ts` 存在
- [x] 数据库配置正确加载
- [x] LLM 配置正确加载
- [x] 环境变量默认值设置

### 数据库层
- [x] `src/database/index.ts` 数据库连接初始化
- [x] `src/database/entities/conversation.entity.ts` 实体定义完整
- [x] `src/database/entities/conversation-message.entity.ts` 实体定义完整
- [x] `src/database/entities/llm-config.entity.ts` 实体定义完整
- [x] 实体关系配置正确（OneToMany）

### 服务层
- [x] ConversationService 使用 Repository 模式
- [x] LLMConfigService 使用 Repository 模式
- [x] 所有 CRUD 操作实现
- [x] 消息添加和更新逻辑正确
- [x] SSE 流式响应逻辑保留
- [x] LLMService 支持多 provider（OpenAI、DeepSeek、Ollama）

### 路由层

#### 对话管理
- [x] POST `/api/ai/conversations` 创建对话
- [x] GET `/api/ai/conversations` 列表对话
- [x] GET `/api/ai/conversations/:id` 获取对话
- [x] DELETE `/api/ai/conversations/:id` 删除对话
- [x] POST `/api/ai/conversations/:id/archive` 归档对话
- [x] POST `/api/ai/conversations/:id/link/:nextId` 链接对话

#### 消息交互
- [x] POST `/api/ai/conversations/:id/messages` 发送消息
- [x] POST `/api/ai/conversations/:id/messages/stream` SSE 流式
- [x] GET `/api/ai/conversations/:id/messages` 获取消息

#### LLM 配置
- [x] POST `/api/ai/llm-configs` 创建配置
- [x] GET `/api/ai/llm-configs` 列表配置
- [x] GET `/api/ai/llm-configs/:id` 获取配置
- [x] PUT `/api/ai/llm-configs/:id` 更新配置
- [x] DELETE `/api/ai/llm-configs/:id` 删除配置
- [x] POST `/api/ai/llm-configs/:id/test` 测试配置

### 响应格式
- [x] 所有 API 返回统一格式 `{ code, data?, message? }`
- [x] 错误响应包含错误信息
- [x] SSE 事件格式正确

### 类型定义
- [x] `src/types.ts` 类型完整
- [x] StreamEvent 类型定义正确
- [x] 请求/响应类型定义完整
- [x] LLMProviderType 枚举定义正确

### 日志
- [x] 关键操作有日志记录
- [x] 使用 pino 结构化日志
- [x] 错误堆栈记录完整

## 功能测试检查

### 创建对话
- [ ] 无参数创建成功
- [ ] 带 title 创建成功
- [ ] 带 collectionId 创建成功
- [ ] 响应包含 id

### 获取对话
- [ ] 存在的 id 返回对话
- [ ] 不存在的 id 返回 404
- [ ] 包含消息列表

### 列表对话
- [ ] 返回对话数组
- [ ] 按 updatedAt 倒序

### 发送消息
- [ ] 用户消息正确保存
- [ ] AI 回复正确保存
- [ ] 元数据正确更新

### SSE 流式响应
- [ ] Content-Type 设置正确
- [ ] metadata 事件首发
- [ ] content 事件逐字返回
- [ ] 最终 metadata 包含分析结果
- [ ] [DONE] 事件正常结束

### 归档功能
- [ ] 状态变更为 archived
- [ ] updatedAt 更新

### 链接功能
- [ ] nextConversationId 正确设置

### LLM 配置
- [ ] 创建配置成功
- [ ] 更新配置成功
- [ ] 删除配置成功
- [ ] 测试连接成功

## 构建和运行检查

### 构建
- [x] TypeScript 编译通过
- [ ] `pnpm build` 成功
- [ ] 输出文件在 dist/

### 运行
- [ ] `pnpm dev` 正常启动
- [ ] 数据库连接成功
- [ ] 健康检查端点可用

### 环境变量
- [x] `.env.example` 包含所有必需变量
- [ ] `.env` 文件可读取
- [ ] 缺失变量有默认值

## 代码质量检查

- [x] 无硬编码配置
- [x] 所有魔法数字定义常量
- [x] 错误处理完善
- [x] 异步操作使用 try/catch
- [x] 路由参数校验

## 文档检查

- [x] SPEC.md 更新
- [x] tasks.md 任务已标记完成
- [x] .env.example 包含所有必需变量
- [x] 代码注释完整

## 前端集成检查

- [x] `apps/web/src/api/ai.ts` 添加 `aiApi` 和 `conversationApi`
- [x] `apps/web/src/api/llm-config.ts` 新建 LLM 配置 API 模块
- [x] `apps/web/src/stores/ai.ts` 使用 `llmConfigApi`
- [x] `apps/web/src/views/AiConfig/AiConfigTestView.vue` 使用 `llmConfigApi`
- [x] `apps/web/vitest.config.ts` 添加 `/api/ai-chat` 代理

## 集成检查

### 与主服务
- [x] API 路径与前端期望一致
- [x] 响应格式与前端期望一致
- [x] 可独立部署
- [x] RawRequirementCollection 模块使用 ai-chat-client.service.ts

### 数据库
- [ ] 迁移脚本可执行
- [ ] ai-chat-service 独立数据库表创建
