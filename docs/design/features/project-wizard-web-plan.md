# Project Wizard Web 实现计划

## 概述

实现 Project Wizard 功能，包括：
1. 创建项目时的向导式录入
2. 项目详情页面显示扩展字段
3. 项目设置页面编辑扩展字段

## 依赖关系

```
DTO 类型定义 (已完成)
    ↓
API 客户端 (Wizard API)
    ↓
Wizard 表单组件 (8步表单)
    ↓
ProjectCreateView (创建向导)
    ↓
ProjectInfoCard (显示新字段)
    ↓
项目设置页面 (编辑新字段)
```

## 任务列表

### Phase 1: API 客户端

#### Task 1: 创建 Wizard API 客户端
- **文件**: `apps/web/src/api/wizard.ts`
- **功能**:
  - `getWizardSteps()` - 获取向导步骤
  - `getWizardStep(stepId)` - 获取单个步骤
  - `saveWizardProgress(progress)` - 保存进度
  - `getWizardProgress(projectId)` - 获取进度
  - `getTechStackSuggestion(data)` - 获取技术栈建议
  - `getAISuggestion(data)` - 获取 AI 建议
  - `completeWizard(data)` - 完成向导创建项目
- **验收**:
  - [ ] API 方法正确调用后端接口
  - [ ] 类型安全，使用 DTO 类型

---

### Phase 2: Wizard 表单组件

#### Task 2: 创建 Wizard 类型定义
- **文件**: `apps/web/src/types/wizard.ts`
- **功能**: 定义前端 Wizard 相关类型
- **内容**:
  - WizardStep, WizardField 接口
  - WizardFormData 表单数据
  - WizardContext 上下文数据

#### Task 3: 创建 WizardField 组件
- **文件**: `apps/web/src/components/wizard/WizardField.vue`
- **功能**: 通用的表单字段渲染组件
- **支持类型**:
  - `text` - Input 输入
  - `number` - Input number
  - `select` - Select 选择
  - `multiselect` - 多选
  - `boolean` - Switch 开关
- **验收**:
  - [ ] 支持所有字段类型
  - [ ] 支持 AI 推荐标记

#### Task 4: 创建 WizardStepItem 组件
- **文件**: `apps/web/src/components/wizard/WizardStepItem.vue`
- **功能**: 单个步骤内容渲染
- **验收**:
  - [ ] 动态渲染字段
  - [ ] 支持 AI 推荐按钮

#### Task 5: 创建 WizardProgress 组件
- **文件**: `apps/web/src/components/wizard/WizardProgress.vue`
- **功能**: 向导进度指示器
- **验收**:
  - [ ] 显示步骤列表
  - [ ] 支持点击跳转

#### Task 6: 创建 TechStackCard 组件
- **文件**: `apps/web/src/components/wizard/TechStackCard.vue`
- **功能**: 技术栈推荐展示卡片
- **验收**:
  - [ ] 显示前端/后端/基础设施/DevOps
  - [ ] 支持一键应用推荐

---

### Phase 3: 创建向导页面

#### Task 7: 创建 ProjectWizardView 页面
- **文件**: `apps/web/src/views/ProjectWizardView/ProjectWizardView.vue`
- **功能**: 完整的向导流程页面
- **步骤**:
  1. 基础信息（名称、描述、业务领域）
  2. 系统类型（系统类型、目标用户）
  3. 架构决策（架构类型、是否微服务）
  4. 技术栈（前端/后端框架）
  5. 数据库配置（数据库类型、ORM）
  6. 部署配置（云服务商、安全等级）
  7. 项目规模（规模、团队人数、周期）
  8. 完成确认
- **验收**:
  - [ ] 8步向导流程完整
  - [ ] 支持 AI 智能推荐
  - [ ] 支持上一步/下一步导航
  - [ ] 完成时创建项目

#### Task 8: 更新路由配置
- **文件**: `apps/web/src/router/index.ts`
- **添加路由**:
  - `/projects/new/wizard` - 向导创建页
- **验收**:
  - [ ] 路由正确注册
  - [ ] 权限控制正确

#### Task 9: 更新项目列表页
- **文件**: `apps/web/src/views/ProjectListView/ProjectListView.vue`
- **添加入口**: 创建项目按钮跳转向导
- **验收**:
  - [ ] 按钮链接到向导页

---

### Phase 4: 项目详情展示

#### Task 10: 更新 ProjectInfoCard 显示新字段
- **文件**: `apps/web/src/views/ProjectDetailView/components/ProjectInfoCard.vue`
- **新增显示**:
  - 系统类型
  - 架构类型
  - 数据库类型
  - 云服务商
  - 安全等级
  - 项目规模
  - 团队人数
  - 技术栈
- **验收**:
  - [ ] 新字段正确显示
  - [ ] 布局美观

#### Task 11: 创建 TechStackDisplay 组件
- **文件**: `apps/web/src/components/wizard/TechStackDisplay.vue`
- **功能**: 技术栈展示
- **验收**:
  - [ ] 分类展示技术栈
  - [ ] 支持折叠/展开

---

### Phase 5: 项目设置编辑

#### Task 12: 创建 ProjectSettingsView 页面
- **文件**: `apps/web/src/views/ProjectSettingsView/ProjectSettingsView.vue`
- **功能**: 项目设置编辑页面
- **编辑内容**:
  - 基础信息（名称、描述）
  - 技术配置（系统类型、架构、数据库、云服务等）
  - 项目规模
- **验收**:
  - [ ] 表单验证完整
  - [ ] 保存功能正常

---

## 检查点

### Checkpoint 1: API 集成 (完成后)
- [ ] Wizard API 客户端完成
- [ ] TypeScript 类型正确

### Checkpoint 2: Wizard 表单 (完成后)
- [ ] 所有步骤组件完成
- [ ] 表单验证正常

### Checkpoint 3: 功能集成 (完成后)
- [ ] 创建向导页面可用
- [ ] 项目详情显示新字段
- [ ] 设置页面可编辑

---

## 文件清单

### 新建文件
```
apps/web/src/
├── api/
│   └── wizard.ts                    # Wizard API 客户端
├── types/
│   └── wizard.ts                   # Wizard 类型定义
├── components/
│   └── wizard/
│       ├── WizardField.vue          # 表单字段组件
│       ├── WizardStepItem.vue       # 步骤项组件
│       ├── WizardProgress.vue       # 进度指示器
│       ├── TechStackCard.vue        # 技术栈卡片
│       └── TechStackDisplay.vue     # 技术栈展示
└── views/
    └── ProjectWizardView/
        └── ProjectWizardView.vue    # 向导页面
```

### 修改文件
```
apps/web/src/
├── views/ProjectListView/
│   └── ProjectListView.vue          # 添加向导入口
├── views/ProjectDetailView/
│   └── components/ProjectInfoCard.vue  # 显示新字段
├── router/index.ts                  # 添加路由
```

---

## 风险与缓解

| 风险 | 影响 | 缓解策略 |
|------|------|----------|
| Wizard 表单复杂度过高 | 中 | 拆分为多个小组件 |
| API 响应格式不确定 | 中 | 先实现基础功能，后续迭代 |
| 类型定义不完整 | 低 | 使用 DTO 类型，确保类型安全 |

## 待确认问题

1. 是否需要 LLM 智能推荐功能？（目前保留 API 接口）
2. Wizard 是否需要保存进度？（目前只保存完成状态）
3. 技术栈配置是否需要详细编辑？（目前只显示）
