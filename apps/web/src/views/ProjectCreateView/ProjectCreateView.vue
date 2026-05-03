<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  Stepper,
  StepperItem,
  StepperIndicator,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { projectsApi } from '@/api/projects'
import { toast } from 'vue-sonner'
import { Loader2, Check, AlertCircle, Info, CalendarDays } from 'lucide-vue-next'

const router = useRouter()
const isSubmitting = ref(false)
const currentStep = ref(1)

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, '项目名称不能为空').max(100, '项目名称最多100个字符'),
    projectKey: z.string()
      .min(1, '项目标识不能为空')
      .max(20, '项目标识最多20个字符')
      .regex(/^[A-Z][A-Z0-9]*$/, '项目标识必须以大写字母开头，只能包含大写字母和数字'),
    description: z.string().max(500, '项目描述最多500个字符').optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).refine((data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate)
    }
    return true
  }, {
    message: '结束日期不能早于开始日期',
    path: ['endDate'],
  })
)

const { handleSubmit, errors, defineField, values } = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: '',
    projectKey: '',
    description: '',
    startDate: '',
    endDate: '',
  },
})

const [name, nameAttrs] = defineField('name')
const [projectKey, projectKeyAttrs] = defineField('projectKey')
const [description, descriptionAttrs] = defineField('description')
const [startDate, startDateAttrs] = defineField('startDate')
const [endDate, endDateAttrs] = defineField('endDate')

// 项目标识实时格式化：自动转为大写
watch(projectKey, (val) => {
  if (val) {
    const upperVal = val.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (upperVal !== val) {
      projectKey.value = upperVal
    }
  }
})

// 项目标识校验状态
const projectKeyStatus = computed(() => {
  const val = values.projectKey
  if (!val) return 'empty'
  if (!/^[A-Z]/.test(val)) return 'invalid-start'
  if (!/^[A-Z][A-Z0-9]*$/.test(val)) return 'invalid-format'
  if (val.length > 20) return 'too-long'
  return 'valid'
})

const projectKeyStatusText = computed(() => {
  const statusMap: Record<string, string> = {
    'empty': '',
    'invalid-start': '需以大写字母开头',
    'invalid-format': '只能包含大写字母和数字',
    'too-long': '最多20个字符',
    'valid': '格式正确',
  }
  return statusMap[projectKeyStatus.value] || ''
})

const onSubmit = handleSubmit(async (formValues) => {
  isSubmitting.value = true
  try {
    await projectsApi.create({
      name: formValues.name,
      projectKey: formValues.projectKey,
      description: formValues.description,
      startDate: formValues.startDate || undefined,
      endDate: formValues.endDate || undefined,
    })
    toast.success('项目创建成功')
    router.push('/projects')
  } catch (error: any) {
    toast.error(error?.message || '项目创建失败')
  } finally {
    isSubmitting.value = false
  }
})

const handleCancel = () => {
  router.push('/projects')
}

// 步骤配置
const steps = [
  { step: 1, title: '基本信息', description: '填写项目名称和标识' },
  { step: 2, title: '项目详情', description: '添加描述和时间' },
  { step: 3, title: '确认创建', description: '检查并提交' },
]

// 步骤导航
const goToStep = (step: number) => {
  if (step <= currentStep.value || canProceedToStep(step)) {
    currentStep.value = step
  }
}

const canProceedToStep = (step: number) => {
  if (step === 1) return true
  if (step === 2) return !!values.name && projectKeyStatus.value === 'valid'
  if (step === 3) return !!values.name && projectKeyStatus.value === 'valid'
  return false
}

const nextStep = () => {
  if (currentStep.value < 3) currentStep.value++
}

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--
}
</script>

<template>
  <div class="container mx-auto py-8 max-w-2xl">
    <!-- 步骤指示器 -->
    <Stepper class="mb-8" :value="currentStep">
      <StepperItem
        v-for="{ step, title, description } in steps"
        :key="step"
        :step="step"
        class="flex-1"
        :data-state="step < currentStep ? 'completed' : step === currentStep ? 'active' : 'inactive'"
      >
        <StepperTrigger class="w-full" @click="goToStep(step)">
          <StepperIndicator
            class="transition-all duration-300"
            :class="{
              'bg-primary text-primary-foreground': step <= currentStep,
              'bg-muted text-muted-foreground': step > currentStep,
            }"
          >
            <Check v-if="step < currentStep" class="h-4 w-4" />
            <span v-else>{{ step }}</span>
          </StepperIndicator>
          <div class="flex flex-col items-start ml-3">
            <StepperTitle
              :class="{
                'text-foreground': step <= currentStep,
                'text-muted-foreground': step > currentStep,
              }"
            >
              {{ title }}
            </StepperTitle>
            <span class="text-xs text-muted-foreground hidden sm:block">{{ description }}</span>
          </div>
        </StepperTrigger>
        <StepperSeparator
          v-if="step < steps.length"
          class="flex-1 ml-4"
          :class="{
            'bg-primary': step < currentStep,
            'bg-muted': step >= currentStep,
          }"
        />
      </StepperItem>
    </Stepper>

    <Card class="transition-shadow duration-300 hover:shadow-lg">
      <CardHeader class="pb-6">
        <CardTitle class="text-2xl">创建项目</CardTitle>
        <CardDescription>填写项目基本信息创建新项目</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-6" @submit="onSubmit">
          <!-- 步骤 1: 基本信息 -->
          <div v-show="currentStep === 1" class="space-y-6 animate-in fade-in duration-300">
            <Field :data-invalid="!!errors.name">
              <FieldLabel for="name" class="text-base">
                项目名称
                <span class="text-destructive ml-0.5">*</span>
              </FieldLabel>
              <Input
                id="name"
                v-model="name"
                v-bind="nameAttrs"
                placeholder="请输入项目名称，如：电商平台重构"
                :aria-invalid="!!errors.name"
                class="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
              <FieldError v-if="errors.name">{{ errors.name }}</FieldError>
            </Field>

            <Field :data-invalid="!!errors.projectKey">
              <div class="flex items-center gap-2">
                <FieldLabel for="projectKey" class="text-base">
                  项目标识
                  <span class="text-destructive ml-0.5">*</span>
                </FieldLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Info class="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" class="max-w-xs">
                      <p>项目标识用于唯一标识项目，创建后不可修改</p>
                      <p class="text-muted-foreground mt-1">格式：大写字母开头，可包含数字</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div class="relative">
                <Input
                  id="projectKey"
                  v-model="projectKey"
                  v-bind="projectKeyAttrs"
                  placeholder="如：PROJ001"
                  :aria-invalid="!!errors.projectKey"
                  class="transition-all duration-200 focus:ring-2 focus:ring-primary/20 pr-10"
                  maxlength="20"
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2">
                  <Check
                    v-if="projectKeyStatus === 'valid'"
                    class="h-4 w-4 text-chart-3 transition-all duration-200"
                  />
                  <AlertCircle
                    v-else-if="projectKeyStatus !== 'empty' && projectKeyStatus !== 'valid'"
                    class="h-4 w-4 text-destructive transition-all duration-200"
                  />
                </div>
              </div>
              <div class="flex items-center justify-between mt-1.5">
                <p
                  class="text-sm transition-colors duration-200"
                  :class="{
                    'text-chart-3': projectKeyStatus === 'valid',
                    'text-destructive': projectKeyStatus !== 'empty' && projectKeyStatus !== 'valid',
                    'text-muted-foreground': projectKeyStatus === 'empty',
                  }"
                >
                  {{ projectKeyStatus === 'empty' ? '用于唯一标识项目，创建后不可修改' : projectKeyStatusText }}
                </p>
                <span class="text-xs text-muted-foreground">{{ projectKey.length }}/20</span>
              </div>
              <FieldError v-if="errors.projectKey">{{ errors.projectKey }}</FieldError>
            </Field>
          </div>

          <!-- 步骤 2: 项目详情 -->
          <div v-show="currentStep === 2" class="space-y-6 animate-in fade-in duration-300">
            <Field :data-invalid="!!errors.description">
              <FieldLabel for="description" class="text-base">项目描述</FieldLabel>
              <Textarea
                id="description"
                v-model="description"
                v-bind="descriptionAttrs"
                placeholder="请输入项目描述（可选）"
                rows="4"
                :aria-invalid="!!errors.description"
                class="transition-all duration-200 focus:ring-2 focus:ring-primary/20 resize-none"
              />
              <div class="flex justify-end mt-1">
                <span class="text-xs text-muted-foreground">{{ description?.length || 0 }}/500</span>
              </div>
              <FieldError v-if="errors.description">{{ errors.description }}</FieldError>
            </Field>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field :data-invalid="!!errors.startDate">
                <FieldLabel for="startDate" class="text-base flex items-center gap-2">
                  <CalendarDays class="h-4 w-4 text-muted-foreground" />
                  开始日期
                </FieldLabel>
                <Input
                  id="startDate"
                  v-model="startDate"
                  v-bind="startDateAttrs"
                  type="date"
                  :aria-invalid="!!errors.startDate"
                  class="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
                <FieldError v-if="errors.startDate">{{ errors.startDate }}</FieldError>
              </Field>

              <Field :data-invalid="!!errors.endDate">
                <FieldLabel for="endDate" class="text-base flex items-center gap-2">
                  <CalendarDays class="h-4 w-4 text-muted-foreground" />
                  结束日期
                </FieldLabel>
                <Input
                  id="endDate"
                  v-model="endDate"
                  v-bind="endDateAttrs"
                  type="date"
                  :aria-invalid="!!errors.endDate"
                  class="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
                <FieldError v-if="errors.endDate">{{ errors.endDate }}</FieldError>
              </Field>
            </div>
          </div>

          <!-- 步骤 3: 确认创建 -->
          <div v-show="currentStep === 3" class="space-y-6 animate-in fade-in duration-300">
            <div class="rounded-lg border bg-muted/50 p-6 space-y-4">
              <div class="flex items-center justify-between pb-4 border-b">
                <span class="text-muted-foreground">项目名称</span>
                <span class="font-medium text-lg">{{ values.name }}</span>
              </div>
              <div class="flex items-center justify-between pb-4 border-b">
                <span class="text-muted-foreground">项目标识</span>
                <code class="px-2 py-1 bg-background rounded text-sm font-mono">{{ values.projectKey }}</code>
              </div>
              <div class="flex items-center justify-between pb-4 border-b">
                <span class="text-muted-foreground">项目描述</span>
                <span class="text-right max-w-xs truncate">{{ values.description || '未填写' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">项目周期</span>
                <span>
                  {{ values.startDate || '未设置' }}
                  <span v-if="values.startDate || values.endDate" class="mx-1 text-muted-foreground">→</span>
                  {{ values.endDate || '未设置' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-between gap-4 pt-6 border-t">
            <Button
              v-if="currentStep > 1"
              type="button"
              variant="outline"
              @click="prevStep"
            >
              上一步
            </Button>
            <Button
              v-else
              type="button"
              variant="outline"
              @click="handleCancel"
            >
              取消
            </Button>

            <Button
              v-if="currentStep < 3"
              type="button"
              :disabled="!canProceedToStep(currentStep + 1)"
              @click="nextStep"
            >
              下一步
            </Button>
            <Button
              v-else
              type="submit"
              :disabled="isSubmitting"
            >
              <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
              {{ isSubmitting ? '创建中...' : '确认创建' }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
