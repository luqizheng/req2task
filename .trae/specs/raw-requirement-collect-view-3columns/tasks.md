# Tasks

## Task 1: 创建 RequirementChatPanel.vue 左侧 AI 对话组件
- [x] Task 1.1: 创建 `apps/web/src/components/requirement/RequirementChatPanel.vue` 文件
- [x] Task 1.2: 实现左侧 AI 对话面板基础布局
- [x] Task 1.3: 集成 AIChat 组件配置
- [x] Task 1.4: 添加对话消息显示和输入功能

## Task 2: 创建 RawRequirementMainPanel.vue 中间主屏幕组件
- [x] Task 2.1: 创建 `apps/web/src/components/requirement/RawRequirementMainPanel.vue` 文件
- [x] Task 2.2: 实现需求详情展示区域
- [x] Task 2.3: 实现追问历史列表展示
- [x] Task 2.4: 添加追问问题点击跳转功能

## Task 3: 创建 RawRequirementSidebar.vue 右侧需求列表组件
- [x] Task 3.1: 创建 `apps/web/src/components/requirement/RawRequirementSidebar.vue` 文件
- [x] Task 3.2: 迁移现有 summary-panel 代码到新组件
- [x] Task 3.3: 实现需求列表点击选择功能
- [x] Task 3.4: 保持需求状态标签显示

## Task 4: 重构 RawRequirementCollectView.vue 主容器
- [x] Task 4.1: 修改 view-body 为三栏 flex 布局
- [x] Task 4.2: 引入三个新组件
- [x] Task 4.3: 调整响应式样式
- [x] Task 4.4: 保持头部和工具栏不变

## Task 5: 更新 useRequirementCollectStore 状态管理
- [x] Task 5.1: 确保 store 正确管理 currentRawRequirementId
- [x] Task 5.2: 验证需求选择状态与组件同步

## Task 6: 响应式布局适配
- [x] Task 6.1: 添加 < 1024px 断点样式
- [x] Task 6.2: 测试移动端布局效果
- [x] Task 6.3: 验证交互功能完整性

# Task Dependencies

- Task 1、Task 2、Task 3 可并行开发
- Task 4 依赖 Task 1、Task 2、Task 3 完成
- Task 5 与 Task 1-4 可并行
- Task 6 依赖 Task 4 完成
