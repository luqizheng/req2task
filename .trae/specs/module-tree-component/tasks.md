# Tasks - ModuleTree 组件实现

## 实现进度

- [x] Task 1: 扩展 API 层 - 在 featureModules.ts 中添加 getTree 方法
- [x] Task 2: 创建 useModuleTreeFilter.ts 组合式函数 - 处理模块过滤逻辑
- [x] Task 3: 创建 ModuleTree.vue 公共组件 - 实现树形模块展示和过滤功能
- [x] Task 4: 验证组件功能 - 确保组件按规范正常工作

## Task Details

### Task 1: 扩展 API 层
**描述**: 在 `apps/web/src/api/featureModules.ts` 中添加 `getTree` 方法，用于获取项目的模块树形结构数据。

**验收标准**:
- [x] 新增 `getTree` 方法，接收 `projectId` 参数
- [x] 调用后端 `/feature-modules/tree/{projectId}` 接口
- [x] 返回 `FeatureModuleResponseDto[]` 类型数据

**依赖**: 无

### Task 2: 创建 useModuleTreeFilter.ts 组合式函数
**描述**: 创建模块树过滤逻辑的组合式函数，处理模块类型的显示/隐藏逻辑。

**验收标准**:
- [x] 创建 `useModuleTreeFilter.ts` 文件于 `apps/web/src/composables/` 目录
- [x] 导出 `ModuleType` 枚举定义
- [x] 导出 `MODULE_TYPE_COLORS` 常量
- [x] 导出 `useModuleTreeFilter` 函数，接收 `hiddenTypes` 参数
- [x] 返回过滤后的模块树数据和切换类型的方法

**依赖**: 无

### Task 3: 创建 ModuleTree.vue 公共组件
**描述**: 创建可复用的树形模块展示组件，使用 Element Plus 的 el-tree 组件实现。

**验收标准**:
- [x] 组件位于 `apps/web/src/components/common/ModuleTree.vue`
- [x] Props 包含 `projectId` (必填)、`defaultExpandAll`、`filterable`、`defaultHiddenTypes`
- [x] 组件挂载时自动加载模块数据
- [x] 空状态显示 "暂无功能模块"
- [x] 节点显示模块名称和类型颜色标签
- [x] 支持节点点击事件 emit
- [x] 当 `filterable` 为 true 时，显示过滤控制区域
- [x] 组件样式与项目风格一致

**依赖**: Task 1, Task 2

### Task 4: 验证组件功能
**描述**: 验证组件能够正常加载和展示模块树数据，支持过滤功能。

**验收标准**:
- [x] 组件能够接收 projectId 并正确加载数据
- [x] 树形结构正确展示父子模块关系
- [x] 模块类型颜色标签正确显示
- [x] 节点交互（展开/收起、点击）正常工作
- [x] 过滤功能正常：取消勾选后相应类型模块隐藏
- [x] 代码符合项目规范（TypeScript 严格模式、ESLint）

**依赖**: Task 1, Task 2, Task 3
