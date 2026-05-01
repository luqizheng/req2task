# RequirementCard 添加保存/删除功能

## 目标
为 `RequirementCard.vue` 添加操作按钮，当需求未保存（id为空或以 `rq_` 开头）时显示删除和保存按钮。

## 实现步骤

### 1. 修改 `store/index.ts`
- 添加 `saveRequirement` 方法：保存单个 `AiGeneratedRequirementDto` 到后端，回填返回的 id
- 添加 `deleteRequirement` 方法：移除指定 id 的需求（已有，验证可用）

### 2. 修改 `useRequirementSubmit.ts`
- 添加 `saveRequirement` 方法：调用后端 API 保存单个需求，返回保存后的完整需求对象

### 3. 修改 `RequirementCard.vue`
- 添加 `isUnsaved` 计算属性：判断 id 是否为空或以 `rq_` 开头
- 添加 `handleSave` 方法：调用 store 保存需求
- 添加 `handleDelete` 方法：调用 store 删除需求
- 在模板底部添加操作按钮区域，仅未保存时显示

### 4. 构建验证
- 运行 `pnpm build` 确保类型检查通过
