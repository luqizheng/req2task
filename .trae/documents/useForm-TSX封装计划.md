# useForm Hook TSX 封装计划（精简版）

## 设计理念

提供极简声明式 API，让字段配置与渲染分离：

```tsx
const { model, validator, handleSubmit, reset } = useForm({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

validator
  .rule('username', (v) => !v && '用户名不能为空')
  .rule('username', (v) => v.length >= 3 || '用户名至少3个字符')
  .rule('email', (v) => /^\S+@\S+$/.test(v) || '邮箱格式错误')
  .rule('password', (v) => v.length >= 6 || '密码至少6位')
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: '两次密码不一致',
  })

const onSubmit = handleSubmit((data) => {
  console.log('提交:', data)
})

// 使用
<template>
  <form @submit="onSubmit">
    <FormField name="username" :validator="validator" label="用户名">
      <Input v-model="model.username" />
    </FormField>
    <FormField name="email" :validator="validator" label="邮箱">
      <Input v-model="model.email" />
    </FormField>
    <button type="submit">提交</button>
  </form>
</template>
```

## 核心类型

```typescript
// 字段验证规则
type ValidationRule = (value: unknown, formData: Record<string, unknown>) => string | false | Promise<string | false>

// 验证器实例
interface FieldValidator {
  rule(name: string, fn: ValidationRule): FieldValidator
  refine(fn: (data: any) => boolean | Promise<boolean>, options?: { message?: string; path?: string[] }): FieldValidator
  validate(name?: string): Promise<{ valid: boolean; errors: Record<string, string> }>
  validateSync(name?: string): { valid: boolean; errors: Record<string, string> }
  getError(name: string): string | undefined
  clearError(name?: string): void
  errors: Ref<Record<string, string>>
}

// 表单实例
interface UseFormReturn<T extends Record<string, unknown>> {
  model: T
  validator: FieldValidator
  handleSubmit(fn: (data: T) => void | Promise<void>): (e: Event) => Promise<void>
  reset(values?: Partial<T>): void
  setFieldValue(name: string, value: unknown): void
}
```

## 文件结构

```
apps/web/src/composables/
└── useForm.tsx    # 单一文件，包含所有类型和实现
```

## 实现步骤

### Step 1: useForm.tsx

创建 `useForm` 函数：

```tsx
import { ref, computed, reactive } from 'vue'
import type { Ref, ComputedRef } from 'vue'

type ValidationRule = (value: unknown, formData: Record<string, unknown>) => string | false | Promise<string | false>

interface ValidatorInstance {
  rule(name: string, fn: ValidationRule): ValidatorInstance
  refine(fn: (data: any) => boolean | Promise<boolean>, options?: { message?: string; path?: string[] }): ValidatorInstance
  validate(name?: string): Promise<{ valid: boolean; errors: Record<string, string> }>
  validateSync(name?: string): { valid: boolean; errors: Record<string, string> }
  getError(name: string): string | undefined
  clearError(name?: string): void
  errors: Ref<Record<string, string>>
}

interface UseFormReturn<T extends Record<string, unknown>> {
  model: T
  validator: ValidatorInstance
  handleSubmit(fn: (data: T) => void | Promise<void>): (e: Event) => Promise<void>
  reset(values?: Partial<T>): void
  setFieldValue(name: string, value: unknown): void
}

export function useForm<T extends Record<string, unknown>>(initialValues: T): UseFormReturn<T> {
  const model = reactive<T>({ ...initialValues })
  const errors = ref<Record<string, string>>({})
  const touched = ref<Set<string>>(new Set())
  const submitting = ref(false)
  const rulesMap = new Map<string, ValidationRule[]>()
  const refineFns: Array<{
    fn: (data: any) => boolean | Promise<boolean>
    message?: string
    path?: string[]
  }> = []

  const validator: ValidatorInstance = {
    rule(name: string, fn: ValidationRule) {
      if (!rulesMap.has(name)) rulesMap.set(name, [])
      rulesMap.get(name)!.push(fn)
      return this
    },

    refine(fn, options = {}) {
      refineFns.push({ fn, message: options.message, path: options.path })
      return this
    },

    async validate(name?: string) {
      const errs: Record<string, string> = {}
      const data = { ...model }

      if (name) {
        const fieldRules = rulesMap.get(name) || []
        for (const rule of fieldRules) {
          const result = await rule(model[name], data)
          if (result) {
            errs[name] = result
            break
          }
        }
      } else {
        for (const [fieldName, fieldRules] of rulesMap) {
          for (const rule of fieldRules) {
            const result = await rule(model[fieldName], data)
            if (result) {
              errs[fieldName] = result
              break
            }
          }
        }

        for (const { fn, message, path } of refineFns) {
          const result = await fn(data)
          if (!result) {
            const targetPath = path?.[0] || Object.keys(data)[0]
            errs[targetPath] = message || '验证失败'
          }
        }
      }

      errors.value = errs
      return { valid: Object.keys(errs).length === 0, errors: errs }
    },

    validateSync(name?: string) {
      const errs: Record<string, string> = {}
      const data = { ...model }

      if (name) {
        const fieldRules = rulesMap.get(name) || []
        for (const rule of fieldRules) {
          const result = rule(model[name], data)
          if (result) {
            errs[name] = result
            break
          }
        }
      } else {
        for (const [fieldName, fieldRules] of rulesMap) {
          for (const rule of fieldRules) {
            const result = rule(model[fieldName], data)
            if (result) {
              errs[fieldName] = result
              break
            }
          }
        }
      }

      errors.value = errs
      return { valid: Object.keys(errs).length === 0, errors: errs }
    },

    getError(name: string) {
      return errors.value[name]
    },

    clearError(name?: string) {
      if (name) {
        delete errors.value[name]
      } else {
        errors.value = {}
      }
    },

    get errors() {
      return errors
    },
  }

  const handleSubmit = (fn: (data: T) => void | Promise<void>) => {
    return async (e: Event) => {
      e.preventDefault()
      submitting.value = true
      try {
        const { valid } = await validator.validate()
        if (valid) {
          await fn({ ...model })
        }
      } finally {
        submitting.value = false
      }
    }
  }

  const reset = (values?: Partial<T>) => {
    if (values) {
      Object.assign(model, values)
    } else {
      Object.assign(model, initialValues)
    }
    errors.value = {}
    touched.value.clear()
  }

  const setFieldValue = (name: string, value: unknown) => {
    if (name in model) {
      (model as any)[name] = value
    }
  }

  return { model, validator, handleSubmit, reset, setFieldValue }
}
```

### Step 2: FormField 组件

```tsx
interface FormFieldProps {
  name: string
  label?: string
  description?: string
  validator: ValidatorInstance
  required?: boolean
  children: any
}

export const FormField = (props: FormFieldProps) => {
  const error = computed(() => props.validator.getError(props.name))
  const hasError = computed(() => !!error.value)

  return (
    <Field data-invalid={hasError.value} class="space-y-2">
      {props.label && (
        <FieldLabel>
          {props.label}
          {props.required && <span class="text-destructive ml-1">*</span>}
        </FieldLabel>
      )}
      {props.children}
      {props.description && !hasError.value && (
        <FieldDescription>{props.description}</FieldDescription>
      )}
      <FieldError errors={error.value ? [error.value] : []} />
    </Field>
  )
}
```

### Step 3: 使用示例

```tsx
import { useForm } from '@/composables/useForm'
import { Field, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const LoginForm = () => {
  const { model, validator, handleSubmit, reset } = useForm({
    username: '',
    password: '',
    remember: false,
  })

  validator
    .rule('username', (v) => !v && '请输入用户名')
    .rule('username', (v) => v.length >= 3 || '用户名至少3位')
    .rule('password', (v) => !v && '请输入密码')
    .rule('password', (v) => v.length >= 6 || '密码至少6位')

  const onSubmit = handleSubmit((data) => {
    console.log('登录:', data)
  })

  return (
    <form onSubmit={onSubmit} class="space-y-4">
      <FormField name="username" label="用户名" validator={validator} required>
        <Input v-model={model.username} placeholder="请输入用户名" />
      </FormField>

      <FormField name="password" label="密码" validator={validator} required>
        <Input v-model={model.password} type="password" placeholder="请输入密码" />
      </FormField>

      <Button type="submit">登录</Button>
    </form>
  )
}
```

## 验证方式

* 运行 `pnpm build:web` 确保无编译错误

* 在现有表单组件中试点使用

