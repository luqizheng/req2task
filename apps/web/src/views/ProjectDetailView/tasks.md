# 需求列表功能开发任务

## 任务总览

为 ProjectDetailView 的产品视图实现需求列表展示和创建需求功能。

## 任务列表

### 任务 1: 状态管理增强

**描述**: 在 ProjectDetailView.vue 中添加需求列表相关状态

**具体工作**:
- [ ] 添加 `useRequirementStore` 导入
- [ ] 添加 `requirementsApi` 导入
- [ ] 添加需求列表相关状态：
  - `requirementList` - 需求列表数据
  - `requirementLoading` - 加载状态
  - `requirementTotal` - 总数
  - `currentPage` - 当前页
  - `pageSize` - 每页大小（默认 10）
- [ ] 添加筛选状态：
  - `statusFilter` - 状态筛选
  - `priorityFilter` - 优先级筛选

**验收标准**:
- 状态正确初始化
- 状态类型正确

---

### 任务 2: 需求列表加载

**描述**: 实现从后端加载需求列表数据

**具体工作**:
- [ ] 添加 `loadRequirements` 函数
- [ ] 调用 `requirementsApi.getListByProject(projectId, params)`
- [ ] 处理加载状态
- [ ] 在 `onMounted` 中调用加载函数

**验收标准**:
- 页面加载时自动获取数据
- 正确处理加载状态
- 正确处理错误

---

### 任务 3: 筛选功能

**描述**: 实现状态和优先级筛选

**具体工作**:
- [ ] 添加 `statusFilter` 和 `priorityFilter` 状态
- [ ] 添加 `handleFilter` 函数
- [ ] 添加 `handleReset` 函数
- [ ] 在筛选条件变化时重新加载列表

**验收标准**:
- 筛选条件变化时自动刷新列表
- 重置按钮清空所有筛选条件

---

### 任务 4: 列表表格 UI

**描述**: 将空状态卡片替换为需求列表表格

**具体工作**:
- [ ] 替换 `empty-state` div 为 `el-table` 组件
- [ ] 实现表格列：
  - 标题列（可点击跳转详情）
  - 优先级列（Tag 显示）
  - 状态列（Tag 显示）
  - 故事点列
  - 用户故事数列
  - 创建时间列
- [ ] 添加表格 loading 状态
- [ ] 添加表格斑马纹

**验收标准**:
- 表格正确显示数据
- 点击标题能跳转
- Loading 状态正确显示

---

### 任务 5: 分页组件

**描述**: 添加分页支持

**具体工作**:
- [ ] 添加 `el-pagination` 组件
- [ ] 实现 `handlePageChange` 函数
- [ ] 实现 `handleSizeChange` 函数
- [ ] 绑定 total、current-page、page-size 属性

**验收标准**:
- 分页器正确显示总数
- 切换页码正确加载对应数据
- 切换每页大小正确加载对应数据

---

### 任务 6: 创建需求对话框

**描述**: 实现创建需求表单对话框

**具体工作**:
- [ ] 添加 `createDialogVisible` 状态
- [ ] 添加 `createFormRef` 引用
- [ ] 添加 `createFormData` 响应式对象：
  - `title` - 标题
  - `moduleIds` - 所属模块（多选）
  - `description` - 描述
  - `priority` - 优先级
- [ ] 添加 `createRules` 验证规则
- [ ] 创建 `el-dialog` 组件：
  - 标题："创建需求"
  - 宽度：500px
  - destroy-on-close

**验收标准**:
- 对话框正确弹出和关闭
- 表单验证正确执行
- 表单数据正确重置

---

### 任务 7: 模块选择器

**描述**: 在创建表单中添加所属模块选择

**具体工作**:
- [ ] 添加 `moduleOptions` 状态存储模块树
- [ ] 添加 `loadModules` 函数获取模块树
- [ ] 在 `onMounted` 中调用 `loadModules`
- [ ] 添加 `el-tree-select` 或 `el-cascader` 组件支持多选
- [ ] 将模块数据转换为级联选择器格式

**验收标准**:
- 模块选择器正确加载项目模块
- 支持选择多个模块
- 未选择时处理正确

---

### 任务 8: 表单提交逻辑

**描述**: 实现创建需求表单提交

**具体工作**:
- [ ] 添加 `handleCreateSubmit` 函数
- [ ] 表单验证通过后调用 API
- [ ] 调用 `requirementsApi.create(moduleId, data)` 或直接使用 store
- [ ] 成功后：
  - 关闭对话框
  - 刷新需求列表
  - 显示成功提示
- [ ] 错误处理：
  - 显示错误提示
  - 不关闭对话框

**验收标准**:
- 创建成功时列表刷新
- 创建失败时显示错误
- 对话框状态正确

---

### 任务 9: 需求详情跳转

**描述**: 实现点击需求查看详情

**具体工作**:
- [ ] 添加 `handleViewDetail` 函数
- [ ] 使用 `router.push` 跳转到 `/requirements/${id}`
- [ ] 在标题列添加点击事件
- [ ] 在详情按钮添加点击事件

**验收标准**:
- 点击需求标题正确跳转
- 点击详情按钮正确跳转

---

### 任务 10: AI 生成需求入口

**描述**: 保留 AI 生成需求入口（可选跳转）

**具体工作**:
- [ ] 添加 AI 生成需求按钮点击处理
- [ ] 使用 `router.push` 跳转到 AI 生成页面
- [ ] 路由: `/projects/${projectId}/ai-generate`

**验收标准**:
- 点击按钮正确跳转

---

## 任务依赖关系

```
任务 1 → 任务 2 → 任务 3 → 任务 4 → 任务 5
                                      ↓
任务 6 → 任务 7 → 任务 8 → 任务 9 ←┘
         ↓
      任务 10
```

## 预计工作量

- 任务 1-5: 核心列表功能 - 约 2 小时
- 任务 6-8: 创建功能 - 约 2 小时
- 任务 9-10: 跳转和交互 - 约 1 小时

**总计**: 约 5 小时
