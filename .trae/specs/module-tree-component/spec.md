# ModuleTree 组件规范

## Why
项目需要一个可复用的树形结构模块展示组件，用于在项目详情页面以及其他视图中可视化显示功能模块的层级关系。支持状态颜色标识、模块过滤、展开收起等交互。

## What Changes
- 新增 `ModuleTree.vue` 公共组件，以树形结构展示项目功能模块
- 新增 `useModuleTreeFilter.ts` 组合式函数，处理模块过滤逻辑
- 后端 API 层添加 `getTree` 方法获取树形模块数据
- 组件支持状态颜色标识、节点操作、展开收起等交互

## Impact
- Affected specs: 功能模块管理、模块树展示
- Affected code:
  - `apps/web/src/api/featureModules.ts` - 新增 getTree API
  - `apps/web/src/components/common/ModuleTree.vue` - 新公共组件
  - `apps/web/src/composables/useModuleTreeFilter.ts` - 过滤逻辑组合式函数

## ADDED Requirements

### Requirement: 模块树组件（公共组件）
系统应提供可复用的 `ModuleTree` 组件，以树形结构展示指定项目的功能模块层级。

#### Scenario: 基础展示
- **GIVEN** 组件接收到有效的 `projectId` prop
- **WHEN** 组件挂载完成
- **THEN** 自动调用 API 获取模块树数据并以树形结构展示

#### Scenario: 节点展示
- **WHEN** 节点渲染时
- **THEN** 显示模块名称，并根据 `moduleType` 显示对应的颜色标签

#### Scenario: 空状态
- **GIVEN** 项目没有任何模块
- **WHEN** 模块数据加载完成
- **THEN** 显示空状态提示 "暂无功能模块"

### Requirement: 模块状态颜色
组件应根据模块类型显示不同的颜色标签。

#### Scenario: 模块类型颜色映射
- **WHEN** 节点渲染时
- **THEN** 根据 `moduleType` 显示对应颜色：
  - `system` (系统级): `#409EFF` (蓝色)
  - `business` (业务级): `#67C23A` (绿色)
  - `feature` (功能级): `#E6A23C` (橙色)

### Requirement: 模块过滤功能
组件应提供过滤功能，允许用户显示/隐藏特定类型的模块。

#### Scenario: 过滤控制
- **GIVEN** 用户传入 `filterable` prop 为 true
- **WHEN** 组件渲染
- **THEN** 显示过滤控制区域，包含系统级/业务级/功能级复选框

#### Scenario: 过滤生效
- **WHEN** 用户取消勾选某类型复选框
- **THEN** 该类型的模块节点被隐藏
- **AND** 子模块如果也是被过滤类型，也应隐藏

#### Scenario: 默认过滤状态
- **GIVEN** 用户未指定 `defaultHiddenTypes` prop
- **WHEN** 组件渲染
- **THEN** 所有类型默认显示（全部勾选）

### Requirement: 节点交互
组件应支持节点的基础交互操作。

#### Scenario: 展开收起
- **WHEN** 用户点击节点展开/收起图标
- **THEN** 相应子节点列表显示/隐藏

#### Scenario: 节点点击
- **WHEN** 用户点击节点名称
- **THEN** 触发 `node-click` 事件，携带节点数据

#### Scenario: 默认展开
- **GIVEN** `default-expand-all` 属性为 true
- **WHEN** 树节点渲染
- **THEN** 所有节点默认展开

## MODIFIED Requirements

### Requirement: API 层扩展
`featureModulesApi` 应新增 `getTree` 方法获取树形模块数据。

#### Scenario: 获取模块树
- **WHEN** 调用 `featureModulesApi.getTree(projectId)`
- **THEN** 返回 `FeatureModuleResponseDto[]` 数组，包含嵌套的 children 属性

## REMOVED Requirements
无

## Technical Constraints

### 组件位置
- 主组件: `apps/web/src/components/common/ModuleTree.vue`
- 过滤逻辑: `apps/web/src/composables/useModuleTreeFilter.ts`

### Props 接口
| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `projectId` | `string` | 是 | - | 项目 ID |
| `defaultExpandAll` | `boolean` | 否 | `false` | 是否默认展开所有节点 |
| `filterable` | `boolean` | 否 | `false` | 是否显示过滤控制 |
| `defaultHiddenTypes` | `ModuleType[]` | 否 | `[]` | 默认隐藏的模块类型 |

### Emits
| Event | 参数类型 | 说明 |
|-------|---------|------|
| `node-click` | `FeatureModuleResponseDto` | 节点点击事件 |

### 数据源
- 调用 `featureModulesApi.getTree(projectId)` 获取树形数据
- 数据结构: `FeatureModuleResponseDto[]`，每个节点包含 `children` 属性

### 模块类型枚举
```typescript
enum ModuleType {
  SYSTEM = 'system',     // 系统级 - 蓝色
  BUSINESS = 'business',  // 业务级 - 绿色
  FEATURE = 'feature'    // 功能级 - 橙色
}
```

### 状态颜色常量
```typescript
const MODULE_TYPE_COLORS = {
  system: '#409EFF',    // 蓝色
  business: '#67C23A',  // 绿色
  feature: '#E6A23C',  // 橙色
};
```

### 样式要求
- 使用 Element Plus 的 `el-tree` 组件
- 使用 Element Plus 的 `el-tag` 组件显示状态标签
- 使用 Element Plus 的 `el-checkbox-group` / `el-checkbox` 实现过滤控制
- 保持项目 UI 一致性
