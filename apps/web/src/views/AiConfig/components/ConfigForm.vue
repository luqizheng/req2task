<script setup lang="ts">
import { ref } from 'vue'
import { Check, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
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
  <form ref="formRef" class="space-y-5 pt-2">
    <div class="space-y-2">
      <Label for="name">配置名称</Label>
      <Input
        id="name"
        v-model="configForm.name"
        placeholder="请输入配置名称"
        maxlength="32"
        :class="errors.name && 'border-destructive'"
      />
      <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
    </div>

    <div class="space-y-2">
      <Label for="provider">提供商</Label>
      <Select :model-value="configForm.provider" @update:model-value="handleProviderChange">
        <SelectTrigger :class="errors.provider && 'border-destructive'">
          <SelectValue placeholder="请选择提供商" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="deepseek">DeepSeek</SelectItem>
          <SelectItem value="openai">OpenAI</SelectItem>
          <SelectItem value="ollama">Ollama</SelectItem>
        </SelectContent>
      </Select>
      <p v-if="errors.provider" class="text-xs text-destructive">{{ errors.provider }}</p>
    </div>

    <div class="space-y-2">
      <Label for="modelName">模型名称</Label>
      <Input
        id="modelName"
        v-model="configForm.modelName"
        placeholder="如: deepseek-chat"
        :class="errors.modelName && 'border-destructive'"
      />
      <p v-if="errors.modelName" class="text-xs text-destructive">{{ errors.modelName }}</p>
    </div>

    <div class="space-y-2">
      <Label for="apiKey">API Key</Label>
      <Input
        id="apiKey"
        v-model="configForm.apiKey"
        type="password"
        :placeholder="editingConfigId ? '留空则不更新' : '请输入API Key'"
      />
    </div>

    <div class="space-y-2">
      <Label for="baseUrl">Base URL</Label>
      <Input
        id="baseUrl"
        v-model="configForm.baseUrl"
        placeholder="可选，如使用代理"
      />
    </div>

    <div class="space-y-2">
      <Label for="maxTokens">最大Token</Label>
      <Input
        id="maxTokens"
        v-model.number="configForm.maxTokens"
        type="number"
        min="1"
        max="100000"
      />
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <Label>温度</Label>
        <span class="text-sm text-muted-foreground">{{ configForm.temperature.toFixed(1) }}</span>
      </div>
      <Slider
        :model-value="[configForm.temperature]"
        :min="0"
        :max="2"
        :step="0.1"
        class="w-full"
        @update:model-value="(val) => { if (val && val[0] !== undefined) configForm.temperature = val[0] }"
      />
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <Label>Top P</Label>
        <span class="text-sm text-muted-foreground">{{ configForm.topP.toFixed(2) }}</span>
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

    <div class="flex items-center gap-6">
      <div class="flex items-center gap-2">
        <Checkbox id="isActive" v-model="configForm.isActive" />
        <Label for="isActive" class="cursor-pointer">启用此配置</Label>
      </div>
      <div class="flex items-center gap-2">
        <Checkbox id="isDefault" v-model="configForm.isDefault" />
        <Label for="isDefault" class="cursor-pointer">设为默认配置</Label>
      </div>
    </div>

    <div class="flex gap-2 pt-2">
      <Button
        type="button"
        :disabled="saving"
        @click="handleSave"
      >
        <Check v-if="!saving" class="h-4 w-4 mr-1" />
        保存
      </Button>
      <Button
        type="button"
        variant="outline"
        :disabled="saving"
        @click="emit('cancel')"
      >
        <X class="h-4 w-4 mr-1" />
        取消
      </Button>
    </div>
  </form>
</template>
