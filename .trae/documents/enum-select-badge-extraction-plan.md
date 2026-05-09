# 枚举 Select + Badge 组件抽离计划

## 目标

为 `packages/dto/src/enums/` 下的 24 个枚举，每种都创建 Select（录入）和 Badge（展示）专用组件。

## 当前状态

| 枚举 | config | Select | Badge |
|------|--------|--------|-------|
| TaskPriority | ✅ | ✅ (需重命名) | ✅ (需重命名) |
| ProjectStatus | ✅ | ✅ | ❌ |
| Priority | ✅ | ❌ | ❌ |
| RequirementStatus | ✅ | ❌ | ❌ |
| RawRequirementStatus | ✅ | ❌ | ❌ |
| TaskStatus | ✅ | ❌ | ❌ |
| 其余 18 个枚举 | ❌ | ❌ | ❌ |

## 实施步骤

### 步骤 1：完善 enum-config.ts 配置

在 `apps/web/src/utils/enum-config.ts` 中为 18 个缺失配置的枚举添加 `EnumConfigMap`：

1. CriteriaType
2. CollectionType
3. SystemType
4. LLMProviderType
5. AttachmentTargetType
6. ArchitectureType
7. ConversationStatus
8. CloudProvider
9. DatabaseType
10. MessageRole
11. ChangeType
12. SecurityLevel
13. ProjectScale
14. RequirementSource
15. ConflictType
16. UserRole
17. Permission
18. NotificationType

每种配置包含 `label`（中文）和 `cssClass`（Tailwind 颜色类）。按现有风格分批添加。

### 步骤 2：重命名现有的 PriorityBadge / PrioritySelect

现有 `PriorityBadge.vue` 和 `PrioritySelect.vue` 实际封装的是 `TaskPriority` 枚举，需要重命名为正确名称：

1. `PriorityBadge.vue` → `TaskPriorityBadge.vue`
2. `PrioritySelect.vue` → `TaskPrioritySelect.vue`
3. 更新 `common/index.ts` 导出名
4. 更新 `RequirementTasks.vue` 中的导入和使用

### 步骤 3：创建 Badge 组件（23 个）

在 `apps/web/src/components/common/` 下按现有 `PriorityBadge.vue` 模式创建：

| 文件名 | 枚举 |
|--------|------|
| `CriteriaTypeBadge.vue` | CriteriaType |
| `CollectionTypeBadge.vue` | CollectionType |
| `SystemTypeBadge.vue` | SystemType |
| `LLMProviderTypeBadge.vue` | LLMProviderType |
| `AttachmentTargetTypeBadge.vue` | AttachmentTargetType |
| `ArchitectureTypeBadge.vue` | ArchitectureType |
| `RawRequirementStatusBadge.vue` | RawRequirementStatus |
| `ConversationStatusBadge.vue` | ConversationStatus |
| `ProjectStatusBadge.vue` | ProjectStatus |
| `CloudProviderBadge.vue` | CloudProvider |
| `DatabaseTypeBadge.vue` | DatabaseType |
| `MessageRoleBadge.vue` | MessageRole |
| `ChangeTypeBadge.vue` | ChangeType |
| `RequirementStatusBadge.vue` | RequirementStatus |
| `SecurityLevelBadge.vue` | SecurityLevel |
| `ProjectScaleBadge.vue` | ProjectScale |
| `TaskStatusBadge.vue` | TaskStatus |
| `RequirementSourceBadge.vue` | RequirementSource |
| `ConflictTypeBadge.vue` | ConflictType |
| `UserRoleBadge.vue` | UserRole |
| `PermissionBadge.vue` | Permission |
| `NotificationTypeBadge.vue` | NotificationType |
| `PriorityBadge.vue` | Priority |
| `TaskPriorityBadge.vue` | TaskPriority（由原 PriorityBadge.vue 重命名） |

### 步骤 4：创建 Select 组件（22 个）

在 `apps/web/src/components/common/` 下按现有 `PrioritySelect.vue` 模式创建：

| 文件名 | 枚举 |
|--------|------|
| `CriteriaTypeSelect.vue` | CriteriaType |
| `CollectionTypeSelect.vue` | CollectionType |
| `SystemTypeSelect.vue` | SystemType |
| `LLMProviderTypeSelect.vue` | LLMProviderType |
| `AttachmentTargetTypeSelect.vue` | AttachmentTargetType |
| `ArchitectureTypeSelect.vue` | ArchitectureType |
| `RawRequirementStatusSelect.vue` | RawRequirementStatus |
| `ConversationStatusSelect.vue` | ConversationStatus |
| `CloudProviderSelect.vue` | CloudProvider |
| `DatabaseTypeSelect.vue` | DatabaseType |
| `MessageRoleSelect.vue` | MessageRole |
| `ChangeTypeSelect.vue` | ChangeType |
| `RequirementStatusSelect.vue` | RequirementStatus |
| `SecurityLevelSelect.vue` | SecurityLevel |
| `ProjectScaleSelect.vue` | ProjectScale |
| `TaskStatusSelect.vue` | TaskStatus |
| `RequirementSourceSelect.vue` | RequirementSource |
| `ConflictTypeSelect.vue` | ConflictType |
| `UserRoleSelect.vue` | UserRole |
| `PermissionSelect.vue` | Permission |
| `NotificationTypeSelect.vue` | NotificationType |
| `PrioritySelect.vue` | Priority |
| `TaskPrioritySelect.vue` | TaskPriority（由原 PrioritySelect.vue 重命名） |

### 步骤 5：更新 common/index.ts 导出

将所有新组件添加到 `apps/web/src/components/common/index.ts` 导出列表。

### 步骤 6：Lint 检查

运行 `pnpm lint` 确保代码无错误。

## 组件模板

### Badge 模板

```vue
<script setup lang="ts">
import { {EnumName} } from '@req2task/dto'
import { {ENUM_NAME}_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: {EnumName}
}>()
</script>

<template>
  <EnumBadge :value="value" :config="{ENUM_NAME}_CONFIG" class="text-xs" />
</template>
```

### Select 模板

```vue
<script setup lang="ts">
import { {EnumName} } from '@req2task/dto'
import { {ENUM_NAME}_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: {EnumName}
}>()

const emit = defineEmits<{
  'update:modelValue': [value: {EnumName}]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="{ENUM_NAME}_CONFIG"
    placeholder="{中文占位}"
    class="w-32 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as {EnumName})"
  />
</template>
```

### Config 条目模板

```ts
export const {ENUM_NAME}_CONFIG: EnumConfigMap<{EnumName}> = {
  [{ENUM}.VALUE]: {
    label: '中文',
    cssClass: 'bg-xxx-100 text-xxx-700',
    dotClass: 'bg-xxx-500',
  },
  // ...
}
```

## 颜色方案分配

| 枚举 | 主色调 |
|------|--------|
| CriteriaType | 多色（蓝/紫/绿/橙/青） |
| CollectionType | 多色（紫/蓝/绿/灰） |
| SystemType | 多色（16色循环） |
| LLMProviderType | 多色（绿/蓝/橙） |
| AttachmentTargetType | 多色（蓝/绿/紫/橙/灰） |
| ArchitectureType | 多色（灰/蓝/绿/紫/橙/青/粉/靛/红） |
| ConversationStatus | 多色（蓝/绿/灰） |
| CloudProvider | 多色（橙/蓝/红/黄/绿/青/灰） |
| DatabaseType | 多色（蓝/橙/绿/红/黄/紫/灰/青/粉/靛/青绿/紫红/棕） |
| MessageRole | 多色（蓝/绿/灰） |
| ChangeType | 多色（蓝/紫/橙/青/黄） |
| SecurityLevel | 多色（灰/蓝/橙/红） |
| ProjectScale | 多色（绿/蓝/紫/红） |
| RequirementSource | 多色（蓝/紫/绿） |
| ConflictType | 多色（橙/蓝/紫/红） |
| UserRole | 多色（红/蓝/紫/绿/橙/灰） |
| Permission | 多色（按模块分组） |
| NotificationType | 多色（按类型分组） |
