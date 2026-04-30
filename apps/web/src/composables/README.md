# Composables

Vue 3 组合式函数目录，集中管理可复用的组件逻辑。

## 目录内容

| 文件 | 说明 |
|------|------|
| `useForm.ts` | 表单验证组合式函数 |
| `useRustFS.ts` | 文件上传组合式函数 |
| `FormField.vue` | 表单字段组件 |
| `index.ts` | 统一导出入口 |

## useForm

表单验证组合式函数，提供字段验证和表单提交能力。

### 核心类型

```typescript
type ValidationRule = (value: unknown, formData: Record<string, unknown>) => string | false | Promise<string | false>

interface ValidatorInstance {
  rule(name: string, fn: ValidationRule): ValidatorInstance
  refine(fn: (data: any) => boolean | Promise<boolean>, options?: RefineOptions): ValidatorInstance
  validate(name?: string): Promise<{ valid: boolean; errors: Record<string, string> }>
  validateSync(name?: string): { valid: boolean; errors: Record<string, string> }
  getError(name: string): string | undefined
  clearError(name?: string): void
  errors: Ref<Record<string, string>>
  touched: Ref<Set<string>>
}

interface UseFormReturn<T> {
  model: T & Record<string, unknown>
  validator: ValidatorInstance
  handleSubmit(fn: (data: T) => void | Promise<void>): (e: Event) => Promise<void>
  reset(values?: Partial<T>): void
  setFieldValue(name: string, value: unknown): void
  isSubmitting: Ref<boolean>
}
```

### 使用示例

```typescript
import { useForm } from '@/composables'

const { model, validator, handleSubmit, reset } = useForm({
  username: '',
  email: '',
})

validator
  .rule('username', (value) => {
    if (!value) return '用户名不能为空'
    return false
  })
  .rule('email', (value) => {
    if (!value) return '邮箱不能为空'
    if (!/^\S+@\S+\.\S+$/.test(value as string)) return '邮箱格式不正确'
    return false
  })
  .refine(
    (data) => data.username !== data.email,
    { message: '用户名和邮箱不能相同', path: ['username'] }
  )

const onSubmit = handleSubmit(async (data) => {
  console.log('提交数据:', data)
})
```

## useRustFS

文件上传组合式函数，基于 RustFS API 进行文件上传和下载管理。

### 核心类型

```typescript
interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'success' | 'error'
  progress: number
  fileDataId?: string
}

interface CreateAttachmentByFileDataIdDto {
  fileDataId: string
  targetType: 'collection' | 'raw_requirement' | 'project'
  targetId?: string
  displayName?: string
  description?: string
  fileName: string
  contentType: string
  size: number
}
```

### 使用示例

```typescript
import { useRustFS } from '@/composables'

const { upload, getDownloadUrl, uploadingFiles } = useRustFS()

// 上传文件
const handleFileSelect = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const fileDataId = await upload(file, (progress) => {
      console.log('上传进度:', progress)
    })
    console.log('文件数据ID:', fileDataId)
  }
}

// 获取下载链接
const downloadFile = async (fileDataId: string) => {
  const url = await getDownloadUrl(fileDataId)
  window.open(url, '_blank')
}
```

## FormField

表单字段包装组件，配合 `useForm` 使用。

### Props

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 字段名称 |
| `label` | `string` | 字段标签 |
| `description` | `string` | 字段描述 |
| `validator` | `ValidatorInstance` | 验证器实例 |
| `required` | `boolean` | 是否必填 |
| `orientation` | `'vertical' \| 'horizontal' \| 'responsive'` | 布局方向 |

### 使用示例

```vue
<script setup lang="ts">
import { FormField, useForm } from '@/composables'
import { Input } from '@/components/ui/input'

const { model, validator } = useForm({ username: '' })

validator.rule('username', (v) => (!v ? '用户名不能为空' : false))
</script>

<template>
  <FormField name="username" label="用户名" :validator="validator" required>
    <Input v-model="model.username" />
  </FormField>
</template>
```
