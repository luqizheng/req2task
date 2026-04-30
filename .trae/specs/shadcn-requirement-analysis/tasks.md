# Tasks

- [ ] Task 1: 重构 RequirementCollectView 为主布局
  - [ ] SubTask 1.1: 创建 RequirementCollectView.vue 主视图
  - [ ] SubTask 1.2: 使用 Sidebar 组件实现布局结构
  - [ ] SubTask 1.3: 集成现有组件到新布局

- [ ] Task 2: 实现 CollectionForm 组件
  - [ ] SubTask 2.1: 使用 Form + Input + Select 组件
  - [ ] SubTask 2.2: 添加验证逻辑（Zod schema）
  - [ ] SubTask 2.3: 处理表单提交

- [ ] Task 3: 实现 RequirementInput 组件
  - [ ] SubTask 3.1: 使用 Textarea 组件
  - [ ] SubTask 3.2: 添加文件上传 UI
  - [ ] SubTask 3.3: 集成 SSE 提交逻辑

- [ ] Task 4: 实现 RequirementList 组件
  - [ ] SubTask 4.1: 使用 Table 组件
  - [ ] SubTask 4.2: 添加分页功能（Pagination）
  - [ ] SubTask 4.3: 实现行选中状态

- [ ] Task 5: 实现 AnalysisPanel 组件
  - [ ] SubTask 5.1: 使用 Alert 组件展示冲突
  - [ ] SubTask 5.2: 使用 Card 组件展示关联需求
  - [ ] SubTask 5.3: 添加 Badge 显示状态

- [ ] Task 6: 创建 RequirementListView 视图
  - [ ] SubTask 6.1: 实现需求表格展示
  - [ ] SubTask 6.2: 实现筛选器（Select + Badge）
  - [ ] SubTask 6.3: 实现搜索功能（Command）

- [ ] Task 7: 创建 RequirementDetailView 视图
  - [ ] SubTask 7.1: 实现需求详情展示
  - [ ] SubTask 7.2: 实现编辑功能
  - [ ] SubTask 7.3: 添加状态流转

- [ ] Task 8: 添加 Sonner Toast 通知
  - [ ] SubTask 8.1: 集成 Sonner 组件
  - [ ] SubTask 8.2: 添加操作反馈
  - [ ] SubTask 8.3: 添加错误提示

- [ ] Task 9: 更新路由配置
  - [ ] SubTask 9.1: 添加新视图路由
  - [ ] SubTask 9.2: 配置路由守卫

# Task Dependencies

- Task 1 完成后才可开始 Task 2-5
- Task 6 和 Task 7 可并行执行
- Task 8 可在任何时间执行

# Validation

- 所有表单需通过 Zod 验证
- 所有组件需使用 shadcn-vue 组件
- 主视图不超过 500 行
- 组件文件不超过 300 行
- 运行 `pnpm build` 无错误
