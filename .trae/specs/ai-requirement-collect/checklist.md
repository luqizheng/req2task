# Checklist - AI 增强需求收集工作台

## 后端 DTO 和实体

- [ ] CreateRawRequirementCollectionDto 定义完整
- [ ] RawRequirementCollectionResponseDto 定义完整
- [ ] AddRawRequirementDto 定义完整（包含 source 字段）
- [ ] ChatMessageDto 定义完整
- [ ] FollowUpQuestionDto 定义完整
- [ ] RequirementAnalysisDto 定义完整
- [ ] RawRequirement 实体包含新增字段
- [ ] RawRequirementCollection 实体关系正确
- [ ] 数据库迁移文件生成并可执行

## 后端服务层

- [ ] RawRequirementCollectionService.createCollection() 实现正确
- [ ] RawRequirementCollectionService.getCollections() 实现正确
- [ ] RawRequirementCollectionService.getCollectionDetail() 实现正确
- [ ] RawRequirementCollectionService.addRawRequirement() 实现正确
- [ ] RawRequirementCollectionService.completeCollection() 验证所有需求已澄清
- [ ] RawRequirementCollectionService.clarifyRawRequirement() 标记已澄清
- [ ] RequirementGenerationService.analyzeWithFollowUp() 生成追问
- [ ] RequirementGenerationService.chatCollect() 保持对话上下文
- [ ] 追问计数逻辑（5轮上限）实现正确
- [ ] RawRequirementCollectionController 所有接口路由正确
- [ ] 接口权限控制正确（需要登录）

## 前端 Store 和 API

- [ ] useRequirementCollectStore 状态定义完整
- [ ] useRequirementCollectStore.createCollection action 正确
- [ ] useRequirementCollectStore.sendMessage action 正确
- [ ] useRequirementCollectStore.addRequirement action 正确
- [ ] useRequirementCollectStore.convertToRequirement action 正确
- [ ] useRequirementCollectStore.selectRawRequirement action 正确
- [ ] useRequirementCollectStore.continueChat action 正确
- [ ] useRequirementCollectStore.clarifyRequirement action 正确
- [ ] useRequirementCollectStore.completeCollection action 正确
- [ ] requirementCollectionApi 接口定义完整
- [ ] API 类型与后端 DTO 一致

## 前端页面组件

- [ ] RequirementCollectView.vue 布局符合设计（60:40 分栏）
- [ ] RequirementCollectView.vue 响应式适配正确（< 1024px 折叠）
- [ ] RequirementCollectHeader.vue 收集选择下拉可用
- [ ] RequirementCollectHeader.vue 新建收集对话框完整
- [ ] RequirementCollectChat.vue 消息气泡渲染正确
- [ ] RequirementCollectChat.vue 追问按钮点击发送正确
- [ ] RequirementCollectChat.vue 输入框支持 Enter 发送
- [ ] RequirementCollectSidebar.vue 收集摘要显示正确
- [ ] RequirementCollectSidebar.vue 原始需求列表渲染正确
- [ ] RequirementCollectSidebar.vue 模块信息显示正确
- [ ] RequirementCollectSidebar.vue 关联需求分析渲染正确
- [ ] ConflictBadge.vue 冲突级别颜色正确
- [ ] 状态标签颜色符合规范

## 路由和页面重构

- [ ] 新路由 `/projects/:projectId/modules/:moduleId/collect` 添加
- [ ] 新路由指向 RequirementCollectView
- [ ] 旧 RawRequirementCollectView.vue 重构为历史页面
- [ ] 添加使用引导说明

## 功能验收

- [ ] 可以创建新的需求收集
- [ ] 可以切换不同的收集会话
- [ ] 可以通过对话收集原始需求
- [ ] AI 返回包含需求摘要
- [ ] AI 生成追问问题正确显示
- [ ] 点击追问自动发送
- [ ] **追问问题持久化存储**
- [ ] **追问答案持久化存储**
- [ ] **追问轮次限制5轮**
- [ ] 右侧面板实时更新
- [ ] 原始需求列表显示完整
- [ ] 冲突需求正确标红
- [ ] 相似需求正确标绿
- [ ] 可以生成正式需求
- [ ] 可以点击需求进入独立会话
- [ ] 独立会话历史正确加载
- [ ] 可以标记需求已澄清
- [ ] 可以删除不需要的需求
- [ ] **结束收集时验证所有需求已澄清或已删除**
- [ ] **有未澄清需求时阻止结束收集**

## UI 验收

- [ ] 页面布局符合 PRD 设计
- [ ] 冲突展示清晰醒目
- [ ] 关联需求展示友好
- [ ] 状态标签颜色一致
- [ ] 移动端适配良好

## 性能验收

- [ ] AI 对话响应 < 5 秒
- [ ] 页面加载 < 1 秒
- [ ] 侧边栏更新无明显延迟
