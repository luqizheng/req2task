# RawRequirementCollectView 三列布局改造规范

## Why

当前 `RawRequirementCollectView.vue` 为左右两栏布局，无法满足需求分析师同时进行 AI 对话和查看需求详情的场景需求。需要改造为三列布局，提升多任务处理效率。

## What Changes

- 新增左侧 AI 对话区域（chat-ai）
- 重构中间区域为主屏幕（显示 RawRequirement 详情和追问内容）
- 右侧保持现有需求概览面板
- 点击需求列表项时更新中间主屏幕内容

## Impact

- Affected specs: AI 增强需求收集工作台
- Affected code:
  - `apps/web/src/views/RawRequirementCollectView.vue` - 主布局重构
  - 新增 `RawRequirementMainPanel.vue` - 中间主屏幕组件
  - 新增 `RequirementChatPanel.vue` - 左侧 AI 对话组件

## ADDED Requirements

### Requirement: 三列布局结构

页面应采用三列布局，左侧 AI 对话，中间需求详情，右侧需求列表。

#### Scenario: 基础布局
- **GIVEN** 用户进入需求收集页面
- **WHEN** 页面加载完成
- **THEN** 页面分为三栏：左侧对话区（约 30%）、中间主屏幕（约 40%）、右侧列表区（约 30%）

#### Scenario: 响应式布局
- **WHEN** 屏幕宽度 < 1024px
- **THEN** 右侧面板自动折叠为可展开的抽屉

### Requirement: 左侧 AI 对话区域

左侧面板提供独立的 AI 对话功能，支持用户与 AI 需求分析师进行交互。

#### Scenario: 独立对话会话
- **WHEN** 用户在左侧输入需求内容
- **THEN** 显示用户消息气泡
- **AND** 调用后端 AI 分析接口
- **AND** 显示 AI 响应气泡

### Requirement: 中间主屏幕

中间主屏幕展示当前选中需求的详细信息和追问内容。

#### Scenario: 需求详情展示
- **WHEN** 用户点击右侧需求列表中的某项
- **THEN** 中间区域显示该需求的详细内容
- **AND** 显示当前追问轮次和历史追问问题

#### Scenario: 追问内容展示
- **WHEN** 当前需求有追问历史
- **THEN** 在主屏幕展示追问问题列表
- **AND** 支持点击追问问题跳转到左侧对话区继续对话

### Requirement: 右侧需求列表

右侧面板保持现有需求列表功能，支持点击选择需求。

#### Scenario: 需求选择
- **WHEN** 用户点击需求列表中的某项
- **THEN** 该需求高亮显示
- **AND** 中间主屏幕更新为该需求的详情

#### Scenario: 需求状态
- **WHEN** 渲染需求列表项
- **THEN** 根据状态显示不同颜色标签：
  - pending（待处理）：灰色
  - processing（处理中）：蓝色
  - clarified（已澄清）：绿色
  - converted（已转换）：绿色
  - discarded（已删除）：灰色

## MODIFIED Requirements

### Requirement: 布局容器重构

原 `view-body` 容器需从两栏 flex 布局改为三栏 flex 布局。

| 元素 | 原来 | 改动后 |
|------|------|--------|
| view-body | 两栏 flex | 三栏 flex |
| chat-panel | 左侧（flex:1） | 新增左侧面板（30%） |
| main-panel | 无 | 新增中间主屏幕（40%） |
| summary-panel | 右侧（320px） | 右侧（30%） |

### Requirement: 组件拆分

将原 `RawRequirementCollectView.vue` 拆分为多个组件以满足文件行数限制。

| 组件 | 职责 |
|------|------|
| RawRequirementCollectView.vue | 主容器，三栏布局 |
| RequirementChatPanel.vue | 左侧 AI 对话面板 |
| RawRequirementMainPanel.vue | 中间需求详情面板 |
| RawRequirementSidebar.vue | 右侧需求列表（可复用现有 summary-panel 代码） |

## Technical Constraints

### 布局比例
- 左侧对话区：30%
- 中间主屏幕：40%
- 右侧列表区：30%
- 最小宽度：每栏不低于 280px

### 组件通信
- 使用 Pinia store (`useRequirementCollectStore`) 管理选中需求状态
- 点击右侧需求列表触发 `store.selectRawRequirement(id)`
- 中间主屏幕通过 `store.currentRawRequirement` 获取当前需求

### 状态管理
- `useRequirementCollectStore` 新增 `currentRawRequirementId` 响应式状态
- 监听需求选择变化，实时更新中间主屏幕

## Design Guidelines

### 布局
- 使用 CSS Grid 或 Flexbox 实现三栏布局
- 保持各栏之间有适当的间距（gutter）
- 响应式断点：< 1024px 时收起右侧面板

### 视觉层级
- 左侧 AI 对话区：专注输入和对话
- 中间主屏幕：重点展示，高对比度
- 右侧列表：辅助导航，高亮当前选中项

### 交互
- 点击需求列表项：更新中间主屏幕
- 追问问题点击：跳转到左侧对话区
- 保持滚动隔离，各栏独立滚动
