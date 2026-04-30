# 软件需求分析系统 shadcn-vue 规范

## Why

当前项目使用自定义 UI 组件实现需求分析功能，缺乏统一的设计语言和维护成本高。引入 shadcn-vue 组件库可以：
- 统一 UI 风格，提升用户体验
- 降低组件维护成本，利用社区维护的组件
- 加快开发速度，减少重复造轮子
- 支持深色模式和主题定制

## What Changes

- 重构 `RawRequirementCollectView` 为 shadcn-vue 实现
- 构建需求列表视图（RequirementListView）
- 构建需求详情视图（RequirementDetailView）
- 构建需求编辑器组件（RawRequirementEditor）
- 使用 shadcn-vue 组件替换现有自定义组件

## Impact

- Affected specs: 需求收集、需求管理
- Affected code:
  - `apps/web/src/views/RawRequirementCollectView/` - 重构为 shadcn-vue
  - `apps/web/src/views/RequirementListView/` - 新建
  - `apps/web/src/views/RequirementDetailView/` - 新建
  - `apps/web/src/views/RawRequirementEditor/` - 重构

## ADDED Requirements

### Requirement: 需求收集工作台

系统应提供需求收集工作台，支持需求分析师高效收集和整理原始需求。

#### Scenario: 创建需求收集
- **WHEN** 用户进入项目详情页，点击"新建需求收集"
- **THEN** 弹出 Dialog 显示收集表单
- **AND** 包含标题、收集类型（会议/访谈/文档/其他）、收集时间字段
- **AND** 表单使用 Form + Input + Select 组件

#### Scenario: 提交原始需求
- **WHEN** 用户在输入框填写需求内容并点击提交
- **THEN** 调用 SSE 接口提交需求
- **AND** 显示 Loading 状态
- **AND** 提交成功后清空输入框

#### Scenario: 需求文件上传
- **WHEN** 用户点击上传按钮
- **THEN** 打开文件选择器
- **AND** 支持音频、文档等多种格式
- **AND** 显示已上传文件列表

### Requirement: 需求列表视图

系统应提供需求列表视图，支持查看、筛选和搜索需求。

#### Scenario: 需求列表展示
- **WHEN** 用户进入需求列表页
- **THEN** 使用 Table 组件展示需求列表
- **AND** 支持分页（Pagination）
- **AND** 支持排序

#### Scenario: 需求筛选
- **WHEN** 用户选择筛选条件
- **THEN** 使用 Select + Badge 组件展示筛选状态
- **AND** 实时更新列表

#### Scenario: 需求搜索
- **WHEN** 用户在搜索框输入关键词
- **THEN** 使用 Input + Command 组件实现搜索
- **AND** 支持模糊匹配

### Requirement: 需求详情视图

系统应提供需求详情视图，展示需求的完整信息和关联内容。

#### Scenario: 需求详情展示
- **WHEN** 用户点击需求列表中的某项
- **THEN** 使用 Card 组件展示需求详情
- **AND** 包含标题、描述、优先级、状态等字段

#### Scenario: 需求编辑
- **WHEN** 用户点击编辑按钮
- **THEN** 切换为编辑模式
- **AND** 使用 Form + Input + Textarea 组件
- **AND** 提交后保存并更新视图

#### Scenario: 需求状态流转
- **WHEN** 用户更改需求状态
- **THEN** 使用 Select 组件选择新状态
- **AND** 显示状态变更动画

### Requirement: 冲突检测展示

系统应展示需求冲突检测结果。

#### Scenario: 冲突需求展示
- **WHEN** AI 检测到冲突需求
- **THEN** 使用 Alert 组件（variant: destructive）展示冲突
- **AND** 使用 Badge 显示冲突类型

#### Scenario: 关联需求展示
- **WHEN** AI 识别到关联需求
- **THEN** 使用 Card 组件展示关联关系
- **AND** 使用 Badge 显示关联类型和相似度

## MODIFIED Requirements

### Requirement: 布局容器

使用 shadcn-vue 布局组件重构页面结构。

| 元素 | 原来 | 改动后 |
|------|------|--------|
| 侧边栏 | 自定义实现 | Sidebar + SidebarMenu |
| 内容区 | 自定义容器 | SidebarInset + Card |
| 对话框 | 自定义实现 | Dialog + Sheet |
| 表单 | 自定义实现 | Form + Field |

## Technical Constraints

### 组件使用规范

- 优先使用 shadcn-vue 组件替换自定义组件
- 组件路径：`@/components/ui/<component>`
- 使用 `cn()` 合并类名
- 样式统一使用 Tailwind CSS

### 必需组件

| 组件 | 用途 |
|------|------|
| Button | 操作按钮 |
| Card | 内容容器 |
| Dialog | 弹窗 |
| Sheet | 侧边抽屉 |
| Form | 表单 |
| Input | 单行输入 |
| Textarea | 多行输入 |
| Select | 下拉选择 |
| Tabs | 标签页切换 |
| Table | 数据列表 |
| Badge | 状态标签 |
| Alert | 警告提示 |
| DropdownMenu | 右键菜单 |
| Separator | 分隔线 |
| ScrollArea | 滚动区域 |
| Sonner | Toast 通知 |

### 文件结构

```
apps/web/src/views/
├── RequirementCollectView/
│   ├── RequirementCollectView.vue    # 主视图（< 500 行）
│   ├── components/
│   │   ├── CollectionForm.vue       # 收集表单
│   │   ├── RequirementInput.vue     # 需求输入
│   │   ├── RequirementList.vue      # 需求列表
│   │   └── AnalysisPanel.vue        # 分析面板
│   └── store/
│       └── index.ts                 # Pinia store
├── RequirementListView/
│   ├── RequirementListView.vue      # 主视图
│   ├── components/
│   │   ├── RequirementTable.vue     # 需求表格
│   │   ├── RequirementFilters.vue   # 筛选器
│   │   └── RequirementSearch.vue    # 搜索框
│   └── store/
│       └── index.ts
└── RequirementDetailView/
    ├── RequirementDetailView.vue     # 主视图
    └── components/
        ├── RequirementHeader.vue    # 头部信息
        ├── RequirementContent.vue    # 详情内容
        ├── RequirementActions.vue    # 操作按钮
        └── ConflictAlert.vue         # 冲突提示
```

## Design Guidelines

### 布局

- 使用 Sidebar 实现侧边导航
- 使用 Card 组件作为内容容器
- 使用 Tabs 实现多视图切换
- 保持响应式设计（md/lg/xl 断点）

### 颜色语义

| 状态 | 颜色 | Badge variant |
|------|------|---------------|
| pending | gray | secondary |
| processing | blue | default |
| clarified | green | success |
| converted | green | success |
| discarded | gray | outline |
| conflict | red | destructive |

### 交互

- 使用 Sonner 显示操作反馈
- 使用 Dialog 确认危险操作
- 使用 DropdownMenu 提供快捷操作
- 保持一致的加载状态（Skeleton）

## Components Mapping

| 原组件 | shadcn-vue 组件 |
|--------|-----------------|
| CommonCard | Card |
| 自定义 Dialog | Dialog |
| 自定义 Form | Form |
| 自定义 Select | Select |
| 自定义 Table | Table |
| 自定义 Badge | Badge |
| 自定义 Alert | Alert |
| 自定义 Tooltip | Tooltip |
