# Spec: 原始需求编辑器添加 AI 生成 Title 功能

## Objective
在原始需求编辑器的表单中添加 title 输入框，并提供 AI 自动生成 title 的功能。用户可以通过点击 magic 按钮，基于原始内容自动生成标题。

**用户故事**:
- 作为需求分析师，我希望能够手动输入或 AI 自动生成原始需求的标题
- 作为需求分析师，当原始内容有内容时，我希望可以点击 magic 按钮让 AI 基于内容生成标题建议

**成功标准**:
- [ ] 表单中显示 title 输入框，位于来源字段之前
- [ ] title 输入框右侧有 magic 按钮（Sparkles 图标）
- [ ] 当 content（原始内容）为空时，magic 按钮禁用
- [ ] 点击 magic 按钮调用 AI API 生成 title
- [ ] 生成的 title 自动填充到 title 输入框
- [ ] title 保存到 rawRequirement 对象中

## Tech Stack
- Vue 3 + TypeScript + `<script setup>`
- shadcn-vue UI 组件
- VeeValidate + Zod 表单验证
- Pinia Store
- SSE 流式通信（AI 服务）

## Project Structure
```
apps/web/src/views/RawRequirementEditor/
├── RawRequirementEditor.vue      # 主组件（修改）
├── useRequirementSubmit.ts       # 提交逻辑（修改）
├── store/index.ts                # Pinia store（已有 title 字段）
├── spec.md                       # 本文件
└── tasks.md                      # 任务列表
```

后端变更：
```
apps/service/src/
├── ai/ai.controller.ts           # 添加生成 title 端点
└── ai/ai.service.ts              # 添加生成 title 逻辑

packages/dto/src/ai/dto/
└── ai.dto.ts                     # 添加 GenerateTitle DTOs
```

## Code Style
- 使用 `<script setup lang="ts">` 语法
- 使用 shadcn-vue 组件（Input, Button, Form 等）
- 表单验证使用 VeeValidate + Zod
- 按钮禁用状态使用 `:disabled` 属性
- 使用 lucide-vue-next 图标库

示例代码风格：
```vue
<FormField v-slot="{ componentField, errorMessage }" name="title">
  <FormItem>
    <FormLabel class="text-xs text-muted-foreground">标题</FormLabel>
    <div class="flex gap-2">
      <FormControl>
        <Input v-bind="componentField" v-model="rawRequirement.title" placeholder="请输入标题" class="h-9 flex-1" />
      </FormControl>
      <Button 
        variant="outline" 
        size="icon" 
        :disabled="!rawRequirement.content?.trim()"
        @click="handleGenerateTitle"
      >
        <Sparkles class="h-4 w-4" />
      </Button>
    </div>
    <FormMessage v-if="errorMessage" class="text-xs" />
  </FormItem>
</FormField>
```

## Implementation Details

### 1. 前端变更

**RawRequirementEditor.vue**:
- 在来源字段之前添加 title 输入框
- title 输入框右侧添加 magic 按钮（Sparkles 图标）
- magic 按钮点击调用 `handleGenerateTitle` 方法
- 添加表单验证规则（title 可选）

**useRequirementSubmit.ts**:
- 添加 `generateTitle` 方法
- 调用后端 API `/api/ai/generate-title`
- 使用 SSE 流接收生成的 title
- 更新 store 中的 title

**API 调用**:
```typescript
// 请求
POST /api/ai/generate-title
{
  "content": "原始需求内容"
}

// 响应（SSE 流）
{ "title": "生成的标题" }
```

### 2. 后端变更

**DTO (packages/dto/src/ai/dto/ai.dto.ts)**:
```typescript
export class GenerateTitleRequestDto {
  @IsString()
  content!: string;
}

export class GenerateTitleResponseDto {
  title!: string;
}
```

**AI Controller (apps/service/src/ai/ai.controller.ts)**:
- 添加 POST `/ai/generate-title` 端点
- 返回 SSE 流

**AI Service (apps/service/src/ai/ai.service.ts)**:
- 添加 `generateTitle` 方法
- 构建 prompt：基于原始内容生成简洁标题
- 调用 LLM 生成标题
- 通过 SSE 返回结果

## Testing Strategy
- 手动测试：验证 UI 交互和 AI 生成流程
- 检查 title 是否正确保存到数据库
- 验证 magic 按钮禁用逻辑

## Boundaries
- **Always**: 
  - 使用 shadcn-vue 组件
  - 添加适当的表单验证
  - 处理 AI 生成错误情况
- **Ask first**: 
  - 修改数据库 schema
  - 添加新的 prompt template
- **Never**: 
  - 在 UI 中使用自定义 CSS
  - 提交未测试的代码

## Open Questions
1. 是否需要限制生成的 title 长度？（建议：50 字符以内）
2. 是否需要显示 AI 生成 loading 状态？（需要）
3. 是否允许用户覆盖生成的 title？（是）
