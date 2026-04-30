<script setup lang="ts">
import { Pencil, Trash2, Play } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LLMConfigResponse } from '@/api/llm-config'
import { getProviderName, getProviderClass, maskApiKey } from '../composables/useProviderUtils'

defineProps<{
  config: LLMConfigResponse
  isEditing: boolean
  deletingId: string | null
  actionLoadingId: string | null
}>()

const emit = defineEmits<{
  edit: [config: LLMConfigResponse]
  delete: [config: LLMConfigResponse]
  setDefault: [config: LLMConfigResponse]
  setActive: [config: LLMConfigResponse]
  test: [config: LLMConfigResponse]
}>()
</script>

<template>
  <Card class="h-full transition-all hover:shadow-md hover:-translate-y-0.5">
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <CardTitle class="text-base truncate">{{ config.name }}</CardTitle>
          <Badge v-if="config.isDefault" variant="default" class="shrink-0">默认</Badge>
          <Badge v-if="!config.isActive" variant="secondary" class="shrink-0">停用</Badge>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 opacity-65 hover:opacity-100"
            :disabled="isEditing"
            @click="emit('edit', config)"
          >
            <Pencil class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 opacity-65 hover:opacity-100"
            :disabled="isEditing || deletingId === config.id"
            :loading="deletingId === config.id"
            @click="emit('delete', config)"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardHeader>

    <CardContent class="space-y-2.5 text-sm">
      <div class="flex items-start gap-2">
        <span class="text-muted-foreground shrink-0 w-16">提供商：</span>
        <Badge variant="outline" :class="getProviderClass(config.provider)">
            {{ getProviderName(config.provider) }}
          </Badge>
      </div>
      <div class="flex items-start gap-2">
        <span class="text-muted-foreground shrink-0 w-16">模型：</span>
        <span class="break-all">{{ config.modelName }}</span>
      </div>
      <div class="flex items-start gap-2">
        <span class="text-muted-foreground shrink-0 w-16">API Key：</span>
        <span class="font-mono text-muted-foreground">{{ maskApiKey(config.apiKey) }}</span>
      </div>
      <div v-if="config.baseUrl" class="flex items-start gap-2">
        <span class="text-muted-foreground shrink-0 w-16">Base URL：</span>
        <span class="break-all text-muted-foreground">{{ config.baseUrl }}</span>
      </div>
      <div class="flex items-start gap-2">
        <span class="text-muted-foreground shrink-0 w-16">参数：</span>
        <span class="text-muted-foreground">
          maxTokens: {{ config.maxTokens }}, temp: {{ config.temperature }}, topP: {{ config.topP ?? 1 }}
        </span>
      </div>
    </CardContent>

    <CardFooter class="pt-3 border-t flex gap-2">
      <Button
        size="sm"
        variant="default"
        :disabled="isEditing"
        @click="emit('test', config)"
      >
        <Play class="h-3.5 w-3.5 mr-1" />
        测试
      </Button>
      <Button
        v-if="!config.isDefault"
        size="sm"
        variant="outline"
        :disabled="isEditing || actionLoadingId === config.id"
        :loading="actionLoadingId === config.id"
        @click="emit('setDefault', config)"
      >
        设为默认
      </Button>
      <Button
        v-if="!config.isActive"
        size="sm"
        variant="outline"
        class="text-green-600 hover:text-green-700"
        :disabled="isEditing || actionLoadingId === config.id"
        :loading="actionLoadingId === config.id"
        @click="emit('setActive', config)"
      >
        激活
      </Button>
    </CardFooter>
  </Card>
</template>
