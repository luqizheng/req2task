# AI Chat Service 完成检查清单

## 代码完整性检查

### 依赖项
- [ ] TypeORM 已安装并配置
- [ ] pg 驱动已安装
- [ ] reflect-metadata 已安装
- [ ] pino 日志库已安装
- [ ] dotenv-expand 已安装（如需要）

### 配置模块
- [ ] `src/config/index.ts` 存在
- [ ] 数据库配置正确加载
- [ ] LLM 配置正确加载
- [ ] 环境变量默认值设置

### 数据库层
- [ ] `src/database/index.ts` 数据库连接初始化
- [ ] `src/database/entities/conversation.entity.ts` 实体定义完整
- [ ] `src/database/entities/conversation-message.entity.ts` 实体定义完整
- [ ] 实体关系配置正确（OneToMany）

### 服务层
- [ ] ConversationService 使用 Repository 模式
- [ ] 所有 CRUD 操作实现
- [ ] 消息添加和更新逻辑正确
- [ ] SSE 流式响应逻辑保留

### 路由层
- [ ] POST `/api/ai/conversations` 创建对话 ✓
- [ ] GET `/api/ai/conversations` 列表对话 ✓
- [ ] GET `/api/ai/conversations/:id` 获取对话 ✓
- [ ] DELETE `/api/ai/conversations/:id` 删除对话 ✓
- [ ] POST `/api/ai/conversations/:id/archive` 归档对话 ✓
- [ ] POST `/api/ai/conversations/:id/link/:nextId` 链接对话 ✓
- [ ] POST `/api/ai/conversations/:id/messages` 发送消息 ✓
- [ ] POST `/api/ai/conversations/:id/messages/stream` SSE 流式 ✓
- [ ] GET `/api/ai/conversations/:id/messages` 获取消息 ✓

### 响应格式
- [ ] 所有 API 返回统一格式 `{ code, data?, message? }`
- [ ] 错误响应包含错误信息
- [ ] SSE 事件格式正确

### 类型定义
- [ ] `src/types.ts` 类型完整
- [ ] StreamEvent 类型定义正确
- [ ] 请求/响应类型定义完整

### 日志
- [ ] 关键操作有日志记录
- [ ] 使用 pino 或类似结构化日志
- [ ] 错误堆栈记录完整

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

## 构建和运行检查

### 构建
- [ ] `pnpm build` 成功
- [ ] 无 TypeScript 错误
- [ ] 输出文件在 dist/

### 运行
- [ ] `pnpm dev` 正常启动
- [ ] 数据库连接成功
- [ ] 健康检查端点可用

### 环境变量
- [ ] `.env` 文件可读取
- [ ] 缺失变量有默认值

## 代码质量检查

- [ ] 无硬编码配置
- [ ] 所有魔法数字定义常量
- [ ] 错误处理完善
- [ ] 异步操作使用 try/catch
- [ ] 路由参数校验

## 文档检查

- [ ] SPEC.md 更新
- [ ] tasks.md 任务已标记完成
- [ ] .env.example 包含所有必需变量
- [ ] 代码注释完整

## 集成检查

### 与主服务
- [ ] API 路径与 NestJS 服务兼容
- [ ] 响应格式与前端期望一致
- [ ] 可独立部署

### 数据库
- [ ] 迁移脚本可执行
- [ ] 表结构与 NestJS 服务一致（如需要共享）
