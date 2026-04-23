# RawRequirementListView 原始需求列表页面规范

## Why

当前 ProjectDetailView 仅有处理后的需求列表（RequirementList），缺少原始需求列表功能。需要添加独立的原始需求列表页面，供需求分析师查看和管理项目的原始需求收集结果。

## What Changes

- 新增 `RawRequirementListView.vue` 原始需求列表页面
- 在 ProjectDetailView 添加导航入口
- 添加原始需求列表 API 调用和状态管理
- 支持原始需求状态筛选和分页

## Impact

- Affected specs: 需求收集工作台
- Affected code:
  - `apps/web/src/views/RawRequirementListView.vue` - 新增页面
  - `apps/web/src/router/index.ts` - 添加路由配置
  - `apps/web/src/views/ProjectDetailView/ProjectDetailView.vue` - 添加导航入口

## ADDED Requirements

### Requirement: 原始需求列表页面

原始需求列表页面应展示项目中所有原始需求的收集状态和内容摘要。

#### Scenario: 页面加载
- **WHEN** 用户访问 `/projects/:id/raw-requirements`
- **THEN** 显示加载状态
- **AND** 调用 `rawRequirementsApi.getByProject(projectId)` 获取列表
- **AND** 渲染需求列表

#### Scenario: 需求列表展示
- **WHEN** 渲染需求列表项
- **THEN** 显示原始需求内容摘要（截取前 100 字符）
- **AND** 显示状态标签
- **AND** 显示收集类型标签
- **AND** 显示创建时间

#### Scenario: 状态筛选
- **WHEN** 用户选择状态筛选
- **THEN** 列表仅显示对应状态的需求
- **AND** 支持多状态筛选

### Requirement: 状态标签

原始需求状态应显示不同颜色标签，便于快速识别。

| 状态 | 标签颜色 | 说明 |
|------|----------|------|
| pending | gray | 待处理 |
| processing | blue | 处理中 |
| completed | green | 已完成 |
| clarified | green | 已澄清 |
| converted | green | 已转换 |
| discarded | gray | 已废弃 |
| failed | red | 失败 |

### Requirement: 导航入口

ProjectDetailView 应提供进入原始需求列表的入口。

#### Scenario: 添加导航按钮
- **WHEN** 用户在项目详情页
- **THEN** 在产品视图或快速操作区显示"原始需求"入口
- **WHEN** 用户点击"原始需求"
- **THEN** 导航到 `/projects/:id/raw-requirements`

## MODIFIED Requirements

### Requirement: 路由配置

新增原始需求列表路由：

```
path: '/projects/:id/raw-requirements',
name: 'rawRequirementList',
component: () => import('@/views/RawRequirementListView.vue')
```

## Technical Constraints

### 组件结构

```
RawRequirementListView.vue
├── 页面头部（返回按钮 + 标题）
├── 筛选栏（状态筛选）
├── 需求列表（el-table）
└── 分页器
```

### 状态管理

使用 `rawRequirementsApi` 获取数据，无需额外 Pinia store。

### API 调用

```typescript
rawRequirementsApi.getByProject(projectId, {
  page: 1,
  limit: 20,
  status: 'pending,processing'
})
```

## Design Guidelines

### 布局
- 页面采用单列布局，居中展示
- 最大宽度 1200px
- 顶部固定导航栏

### 样式
- 沿用项目现有设计规范
- 保持与 RequirementList.vue 一致的视觉风格
- 状态标签使用 Element Plus 的 el-tag
