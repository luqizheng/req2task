<script setup lang="ts">
import { ref } from 'vue'
import { Check, X, Sparkles, Key, Server, Type, Settings2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ConfigFormData } from '../composables/useAiConfigForm'

defineProps<{
  editingConfigId: string | null
  saving: boolean
}>()

const configForm = defineModel<ConfigFormData>('configForm', {
  required: true,
})

const emit = defineEmits<{
  save: []
  cancel: []
  applyDefaults: [provider: string]
}>()

const formRef = ref<HTMLFormElement>()
const errors = ref<Record<string, string>>({})

const validate = (): boolean => {
  errors.value = {}

  if (!configForm.value.name || configForm.value.name.length < 2) {
    errors.value.name = '名称长度 2-32 个字符'
  }
  if (!configForm.value.provider) {
    errors.value.provider = '请选择提供商'
  }
  if (!configForm.value.modelName) {
    errors.value.modelName = '请输入模型名称'
  } else if (configForm.value.modelName.includes(' ')) {
    errors.value.modelName = '模型名称不能包含空格'
  }

  return Object.keys(errors.value).length === 0
}

const handleSave = () => {
  if (validate()) {
    emit('save')
  }
}

const handleProviderChange = (value: unknown) => {
  const providerValue = String(value)
  configForm.value.provider = providerValue
  emit('applyDefaults', providerValue)
}
</script>

<template>
  <form ref="formRef" class="space-y-6">
    <!-- 基本信息 -->
    <div class="space-y-4">
      <div class="flex items-center gap-2 text-sm font-medium text-foreground/80">
        <Sparkles class="h-4 w-4 text-primary" />
        <span>基本信息</span>
      </div>
      
      <div class="space-y-4 pl-6">
        <div class="space-y-2">
          <Label for="name" class="text-sm font-medium">
            配置名称
            <span class="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            v-model="configForm.name"
            placeholder="如：DeepSeek 生产环境"
            maxlength="32"
            :class="errors.name && 'border-destructive focus-visible:ring-destructive'"
            class="h-10"
          />
          <p v-if="errors.name" class="text-xs text-destructive flex items-center gap-1">
            <span>•</span>
            {{ errors.name }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="provider" class="text-sm font-medium">
            提供商
            <span class="text-destructive">*</span>
          </Label>
          <Select :model-value="configForm.provider" @update:model-value="handleProviderChange">
            <SelectTrigger 
              :class="errors.provider && 'border-destructive focus-visible:ring-destructive'"
              class="h-10"
            >
              <SelectValue placeholder="选择 LLM 提供商" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deepseek">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                  DeepSeek
                </div>
              </SelectItem>
              <SelectItem value="openai">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-green-500"></span>
                  OpenAI
                </div>
              </SelectItem>
              <SelectItem value="ollama">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                  Ollama
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="errors.provider" class="text-xs text-destructive flex items-center gap-1">
            <span>•</span>
            {{ errors.provider }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="modelName" class="text-sm font-medium">
            模型名称
            <span class="text-destructive">*</span>
          </Label>
          <Input
            id="modelName"
            v-model="configForm.modelName"
            placeholder="如：deepseek-chat, gpt-4, llama2"
            :class="errors.modelName && 'border-destructive focus-visible:ring-destructive'"
            class="h-10"
          />
          <p v-if="errors.modelName" class="text-xs text-destructive flex items-center gap-1">
            <span>•</span>
            {{ errors.modelName }}
          </p>
          <p v-else class="text-xs text-muted-foreground">
            输入具体的模型标识符，如 deepseek-chat、gpt-4-turbo
          </p>
        </div>
      </div>
    </div>

    <Separator class="bg-border/60" />

    <!-- 连接配置 -->
    <div class="space-y-4">
      <div class="flex items-center gap-2 text-sm font-medium text-foreground/80">
        <Key class="h-4 w-4 text-primary" />
        <span>连接配置</span>
      </div>
      
      <div class="pl-6 space-y-4">
        <div class="space-y-2">
          <Label for="apiKey" class="text-sm font-medium">
            API Key
            <span v-if="!editingConfigId" class="text-destructive">*</span>
          </Label>
          <Input
            id="apiKey"
            v-model="configForm.apiKey"
            type="password"
            :placeholder="editingConfigId ? '•••••••••••• (留空则不更新)' : 'sk-xxxxxxxxxxxxxxxx'"
            class="h-10 font-mono text-sm"
          />
          <p class="text-xs text-muted-foreground">
            {{ editingConfigId ? '留空则保持原有 API Key 不变' : '您的 API 密钥将被安全加密存储' }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="baseUrl" class="text-sm font-medium">Base URL</Label>
          <div class="relative">
            <Server class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="baseUrl"
              v-model="configForm.baseUrl"
              placeholder="https://api.example.com/v1"
              class="h-10 pl-9"
            />
          </div>
          <p class="text-xs text-muted-foreground">
            可选，用于自定义代理或私有化部署
          </p>
        </div>
      </div>
    </div>

    <Separator class="bg-border/60" />

    <!-- 模型参数 -->
    <div class="space-y-4">
      <div class="flex items-center gap-2 text-sm font-medium text-foreground/80">
        <Settings2 class="h-4 w-4 text-primary" />
        <span>模型参数</span>
      </div>
      
      <div class="pl-6 space-y-5">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label for="maxTokens" class="text-sm font-medium flex items-center gap-1.5">
              <Type class="h-3.5 w-3.5 text-muted-foreground" />
              最大 Token 数
            </Label>
            <span class="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
              {{ configForm.maxTokens }}
            </span>
          </div>
          <Input
            id="maxTokens"
            v-model.number="configForm.maxTokens"
            type="number"
            min="1"
            max="100000"
            class="h-10"
          />
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <Label class="text-sm font-medium">温度 (Temperature)</Label>
            <span class="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded min-w-[3rem] text-center">
              {{ configForm.temperature.toFixed(1) }}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-muted-foreground w-8">精确</span>
            <Slider
              :model-value="[configForm.temperature]"
              :min="0"
              :max="2"
              :step="0.1"
              class="flex-1"
              @update:model-value="(val) => { if (val && val[0] !== undefined) configForm.temperature = val[0] }"
            />
            <span class="text-xs text-muted-foreground w-8 text-right">创意</span>
          </div>
          <p class="text-xs text-muted-foreground">
            较低值产生更确定的输出，较高值增加创造性
          </p>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <Label class="text-sm font-medium">Top P</Label>
            <span class="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded min-w-[3rem] text-center">
              {{ configForm.topP.toFixed(2) }}
            </span>
          </div>
          <Slider
            :model-value="[configForm.topP]"
            :min="0"
            :max="1"
            :step="0.05"
            class="w-full"
            @update:model-value="(val) => { if (val && val[0] !== undefined) configForm.topP = val[0] }"
          />
        </div>
      </div>
    </div>

    <Separator class="bg-border/60" />

    <!-- 状态设置 -->
    <div class="space-y-4">
      <div class="flex items-center gap-2 text-sm font-medium text-foreground/80">
        <Settings2 class="h-4 w-4 text-primary" />
        <span>状态设置</span>
      </div>
      
      <div class="pl-6 flex flex-col gap-4">
        <label class="flex items-start gap-3 cursor-pointer group">
          <Checkbox id="isActive" v-model="configForm.isActive" class="mt-0.5" />
          <div class="space-y-0.5">
            <span class="text-sm font-medium group-hover:text-foreground transition-colors">启用此配置</span>
            <p class="text-xs text-muted-foreground">启用后可在 AI 功能中使用此配置</p>
          </div>
        </label>
        
        <label class="flex items-start gap-3 cursor-pointer group">
          <Checkbox id="isDefault" v-model="configForm.isDefault" class="mt-0.5" />
          <div class="space-y-0.5">
            <span class="text-sm font-medium group-hover:text-foreground transition-colors">设为默认配置</span>
            <p class="text-xs text-muted-foreground">作为新建项目的首选 AI 配置</p>
          </div>
        </label>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex gap-3 pt-4 border-t sticky bottom-0 bg-background pb-2">
      <Button
        type="button"
        :disabled="saving"
        class="flex-1 gap-1.5"
        @click="handleSave"
      >
        <Check v-if="!saving" class="h-4 w-4" />
        <span v-if="saving">保存中...</span>
        <span v-else>保存配置</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        :disabled="saving"
        class="gap-1.5"
        @click="emit('cancel')"
      >
        <X class="h-4 w-4" />
        取消
      </Button>
    </div>
  </form>
</template>
