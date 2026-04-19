# 智能追问功能检查清单

## 代码审查检查点

### 数据模型
- [ ] `conversation.entity.ts` 存在且位置正确
- [ ] `conversation-message.entity.ts` 存在且位置正确
- [ ] 实体包含所有必要字段（id, collectionId, rawRequirementId, title, status, questionCount, messageCount, summary）
- [ ] `MessageRole` 枚举定义完整（USER, ASSISTANT, SYSTEM）
- [ ] `ConversationStatus` 枚举定义完整（ACTIVE, COMPLETED, ARCHIVED）
- [ ] 关系配置正确（ManyToOne, OneToMany, cascade）
- [ ] RawRequirement 实体已移除 sessionHistory 和 followUpQuestions
- [ ] RawRequirementCollection 实体已添加 mainConversationId

### 提示词
- [ ] `conversation.prompts.ts` 文件存在
- [ ] `INTELLIGENT_FOLLOW_UP` 提示词实现完整
- [ ] `MULTI_REQUIREMENT_EXTRACTION` 提示词实现完整
- [ ] `CONVERSATION_SUMMARY` 提示词实现完整
- [ ] 提示词类别包含 'conversation'
- [ ] 参数类型定义正确

### 服务层
- [ ] `conversation.service.ts` 文件存在
- [ ] 所有 CRUD 方法实现完整
- [ ] `sendMessage` 方法包含完整对话流程
- [ ] 智能追问逻辑正确实现
- [ ] 多需求识别逻辑正确实现
- [ ] 错误处理完善

### API 层
- [ ] ConversationController 实现完整
- [ ] 所有端点路由正确
- [ ] 请求/响应 DTO 定义完整
- [ ] Swagger 文档装饰器添加

### 前端
- [ ] API 客户端方法实现完整
- [ ] Pinia store 实现完整
- [ ] 组件状态正确管理
- [ ] 消息持久化同步逻辑正确
- [ ] 追问问题展示逻辑正确

### 测试覆盖
- [ ] 单元测试覆盖核心逻辑
- [ ] 集成测试覆盖完整流程
- [ ] 边界条件测试通过

## 功能验证检查点

### 对话创建
- [ ] 可以为收集创建新会话
- [ ] 可以为单个需求创建会话
- [ ] 会话 ID 正确关联

### 消息发送
- [ ] 用户消息正确保存
- [ ] AI 回复正确保存
- [ ] 消息顺序正确
- [ ] 时间戳正确

### 智能追问
- [ ] AI 生成追问问题
- [ ] 追问问题可点击快速发送
- [ ] 追问次数正确限制
- [ ] 达到上限后正确结束对话

### 多需求识别
- [ ] AI 正确识别多个需求
- [ ] 识别结果正确保存
- [ ] 需求类型标注正确
- [ ] 优先级判断合理

### 状态管理
- [ ] 会话状态正确切换
- [ ] 摘要正确生成
- [ ] 完成状态正确更新

### 持久化
- [ ] 刷新页面后对话历史保留
- [ ] 切换需求后对话历史保留
- [ ] 数据库迁移成功执行

## 代码质量检查点

### 命名规范
- [ ] 实体名称符合命名规范（PascalCase）
- [ ] 方法名称符合命名规范（camelCase）
- [ ] 变量名称语义清晰
- [ ] 文件名称与内容对应

### 类型安全
- [ ] 所有接口有类型定义
- [ ] 无 any 类型滥用
- [ ] 枚举使用正确
- [ ] 类型推断正确

### 错误处理
- [ ] 服务层有异常处理
- [ ] API 层有错误响应
- [ ] 前端有错误提示
- [ ] 日志记录完整

### 代码复用
- [ ] 复用现有实体关系
- [ ] 复用现有工具函数
- [ ] 避免重复代码

### 性能
- [ ] 大对话历史分页加载
- [ ] 消息懒加载
- [ ] 无内存泄漏

## 安全检查点

- [ ] SQL 注入防护
- [ ] XSS 防护（内容转义）
- [ ] 权限验证（用户只能访问自己的会话）
- [ ] 数据隔离正确

## 文档检查点

- [ ] 实体文档注释完整
- [ ] 方法文档注释完整
- [ ] API 文档完整
- [ ] 更新数据库设计文档

## 部署检查点

- [ ] 数据库迁移脚本可执行
- [ ] 环境变量配置正确
- [ ] 提示词配置正确加载
- [ ] 前端构建无错误

## 回归测试检查点

### 现有功能
- [ ] 收集列表加载正常
- [ ] 收集详情加载正常
- [ ] 创建收集功能正常
- [ ] 删除收集功能正常
- [ ] 添加原始需求正常
- [ ] 完成收集功能正常

### 兼容性
- [ ] 旧版 RawRequirement 数据兼容
- [ ] 旧版 sessionHistory 迁移处理
- [ ] API 向后兼容
