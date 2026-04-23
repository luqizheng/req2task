# 重构 RawRequirmentCreateView 为 Wizard 模式

## 目标
将 `RawRequirmentCreateView.vue` 从当前的对话框模式重构为 Wizard（向导）模式，包含三个步骤。

## 步骤设计

### Step 1: 录入原始需求
- 使用现有的 `AiSubmit` 组件
- 提交成功后自动进入 Step 2
- 保存提交的原始需求数据

### Step 2: 问题列表
- 显示 AI 返回的问题列表（如果有）
- 支持手工添加问题和回答
- 支持删除问题（不用回答）
- 所有问题回答后，显示"生成需求"按钮
- 点击"生成需求"后调用 API 生成需求，完成后进入 Step 3

### Step 3: 产生的结果
- 展示生成的需求详情
- 支持查看详情、编辑等操作
- 提供"完成"或"继续添加"选项

## 实现计划

### 1. 创建 Wizard 容器组件
**文件**: `src/components/wizard/WizardContainer.vue`
- 管理步骤状态 (currentStep)
- 步骤切换逻辑
- 步骤验证

### 2. 创建 Wizard 步骤指示器组件
**文件**: `src/components/wizard/WizardStepIndicator.vue`
- 显示当前步骤
- 步骤导航
- 步骤状态（完成、进行中、未开始）

### 3. 创建 Step 1 组件
**文件**: `src/components/wizard/steps/RawRequirementInputStep.vue`
- 集成 AiSubmit 组件
- 提交成功回调
- 自动进入下一步

### 4. 创建 Step 2 组件
**文件**: `src/components/wizard/steps/QuestionListStep.vue`
- 问题列表展示
- 添加问题/回答
- 删除问题
- 生成需求按钮
- 调用 AI 生成需求

### 5. 创建 Step 3 组件
**文件**: `src/components/wizard/steps/RequirementResultStep.vue`
- 展示生成的需求
- 查看详情链接
- 完成/继续操作

### 6. 创建 Wizard 状态管理 Composable
**文件**: `src/composables/useWizard.ts`
- 步骤状态管理
- 数据传递
- 步骤验证逻辑

### 7. 重构 RawRequirmentCreateView.vue
**文件**: `src/views/RawRequirmentCreateView.vue`
- 使用 WizardContainer 替代现有的 el-dialog
- 移除对话模式
- 整合三个步骤组件

## 数据流

```
Step 1 (AiSubmit)
    ↓ 提交成功
Step 2 (QuestionList)
    ↓ 所有问题已回答，点击"生成需求"
Step 3 (RequirementResult)
    ↓ 完成
返回 Step 1 或关闭
```

## 类型定义

```typescript
interface WizardState {
  currentStep: 1 | 2 | 3;
  rawRequirement: RawRequirementResponseDto | null;
  questions: QAItem[];
  generatedRequirement: GeneratedRequirement | null;
}

interface QAItem {
  id: string;
  question: string;
  answer: string;
  isAnswered: boolean;
  isDeleted: boolean;
  isManuallyAdded: boolean;
}
```

## 组件关系

```
RawRequirmentCreateView.vue
├── WizardContainer.vue
│   ├── WizardStepIndicator.vue
│   ├── Step 1: RawRequirementInputStep.vue
│   │   └── AiSubmit.vue
│   ├── Step 2: QuestionListStep.vue
│   └── Step 3: RequirementResultStep.vue
```

## 关键 API 调用

1. **提交原始需求**
   - `POST /api/raw-requirements/{projectId}/stream` (SSE)
   - 返回: RawRequirementResponseDto

2. **生成需求**
   - `POST /api/ai/generate-from-raw/{rawRequirementId}`
   - 返回: GenerateRequirementResultDto

## 状态管理

使用 `useWizard` Composable 管理 Wizard 状态，无需引入 Pinia store（Wizard 状态仅在此页面使用）。
