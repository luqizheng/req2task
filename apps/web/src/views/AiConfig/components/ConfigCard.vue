<script setup lang="ts">
import { Pencil, Trash2, Play, Star, CheckCircle2, XCircle, Cpu, Key, Link2, SlidersHorizontal } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { LLMConfigResponse } from '@/api/llm-config'
import { getProviderName, getProviderClass, maskApiKey } from '../composables/useProviderUtils'

const props = defineProps<{
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

const isDeleting = (configId: string) => props.deletingId === configId
const isActionLoading = (configId: string) => props.actionLoadingId === configId
</script>

<template>
  <Card 
    class="group h-full flex flex-col transition-all duration-300 ease-out
           border-border/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5
           hover:-translate-y-0.5"
  >
    <CardHeader class="pb-3 space-y-0">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <!-- 提供商图标 -->
          <div 
            class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors"
            :class="getProviderClass(config.provider)"
          >
            <Cpu class="h-4.5 w-4.5" />
          </div>
          
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <CardTitle class="text-sm font-semibold truncate">{{ config.name }}</CardTitle>
            </div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <Badge 
                v-if="config.isDefault" 
                variant="default" 
                class="shrink-0 h-5 text-[10px] px-1.5 gap-0.5"
              >
                <Star class="h-3 w-3 fill-current" />
                默认
              </Badge>
              <Badge 
                v-if="config.isActive" 
                variant="outline" 
                class="shrink-0 h-5 text-[10px] px-1.5 gap-0.5 text-green-600 border-green-200 bg-green-50"
              >
                <CheckCircle2 class="h-3 w-3" />
                启用
              </Badge>
              <Badge 
                v-else 
                variant="secondary" 
                class="shrink-0 h-5 text-[10px] px-1.5 gap-0.5"
              >
                <XCircle class="h-3 w-3" />
                停用
              </Badge>
            </div>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8"
                  :disabled="isEditing"
                  @click="emit('edit', config)"
                >
                  <Pencil class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>编辑</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                  :disabled="isEditing || isDeleting(config.id)"
                  :loading="isDeleting(config.id)"
                  @click="emit('delete', config)"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>删除</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </CardHeader>

    <CardContent class="space-y-3 text-sm flex-1">
      <!-- 提供商 -->
      <div class="flex items-center gap-2.5">
        <div class="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Cpu class="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span class="text-muted-foreground text-xs shrink-0 w-12">提供商</span>
        <Badge 
          variant="outline" 
          class="text-xs font-medium"
          :class="getProviderClass(config.provider)"
        >
          {{ getProviderName(config.provider) }}
        </Badge>
      </div>
      
      <!-- 模型 -->
      <div class="flex items-center gap-2.5">
        <div class="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0">
          <SlidersHorizontal class="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span class="text-muted-foreground text-xs shrink-0 w-12">模型</span>
        <span class="font-medium text-foreground/90 truncate">{{ config.modelName }}</span>
      </div>
      
      <!-- API Key -->
      <div class="flex items-center gap-2.5">
        <div class="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Key class="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span class="text-muted-foreground text-xs shrink-0 w-12">API Key</span>
        <code class="font-mono text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{{ maskApiKey(config.apiKey) }}</code>
      </div>
      
      <!-- Base URL (可选) -->
      <div v-if="config.baseUrl" class="flex items-center gap-2.5">
        <div class="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Link2 class="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span class="text-muted-foreground text-xs shrink-0 w-12">Base URL</span>
        <span class="text-xs text-muted-foreground truncate">{{ config.baseUrl }}</span>
      </div>
      
      <Separator class="my-2" />
      
      <!-- 参数 -->
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <div class="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md">
          <span class="text-[10px] uppercase tracking-wider">Max</span>
          <span class="font-medium text-foreground/80">{{ config.maxTokens }}</span>
        </div>
        <div class="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md">
          <span class="text-[10px] uppercase tracking-wider">Temp</span>
          <span class="font-medium text-foreground/80">{{ config.temperature }}</span>
        </div>
        <div class="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md">
          <span class="text-[10px] uppercase tracking-wider">TopP</span>
          <span class="font-medium text-foreground/80">{{ config.topP ?? 1 }}</span>
        </div>
      </div>
    </CardContent>

    <CardFooter class="pt-3 border-t gap-2">
      <Button
        size="sm"
        :disabled="isEditing"
        class="flex-1 gap-1.5"
        @click="emit('test', config)"
      >
        <Play class="h-3.5 w-3.5" />
        测试
      </Button>
      
      <Button
        v-if="!config.isDefault"
        size="sm"
        variant="outline"
        :disabled="isEditing || isActionLoading(config.id)"
        :loading="isActionLoading(config.id) && deletingId !== config.id"
        class="flex-1"
        @click="emit('setDefault', config)"
      >
        设为默认
      </Button>
      
      <Button
        v-if="!config.isActive"
        size="sm"
        variant="outline"
        class="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 hover:border-green-200"
        :disabled="isEditing || isActionLoading(config.id)"
        :loading="isActionLoading(config.id) && deletingId !== config.id"
        @click="emit('setActive', config)"
      >
        激活
      </Button>
    </CardFooter>
  </Card>
</template>
