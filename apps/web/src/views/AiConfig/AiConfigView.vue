<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Settings, Sparkles } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useAiStore } from '@/stores/ai'
import type { LLMConfigResponse } from '@/api/llm-config'
import { useAiConfig } from './composables/useAiConfig'
import { useAiConfigForm } from './composables/useAiConfigForm'
import ConfigCard from './components/ConfigCard.vue'
import ConfigForm from './components/ConfigForm.vue'

const router = useRouter()
const aiStore = useAiStore()

const {
  loading,
  deletingId,
  actionLoadingId,
  deleteConfig,
  setDefault,
  setActive,
} = useAiConfig()

const {
  configForm,
  saving,
  resetForm,
  applyProviderDefaults,
  fillFormForEdit,
  saveConfig,
} = useAiConfigForm()

const sheetOpen = ref(false)
const editingConfigId = ref<string | null>(null)

const sheetTitle = computed(() =>
  editingConfigId.value ? '编辑配置' : '添加配置'
)

const sheetDescription = computed(() =>
  editingConfigId.value ? '修改现有 AI 模型配置' : '配置新的 AI 模型连接'
)

const handleAdd = () => {
  resetForm()
  applyProviderDefaults(configForm.provider)
  editingConfigId.value = null
  sheetOpen.value = true
}

const handleEdit = (config: LLMConfigResponse) => {
  fillFormForEdit(config)
  editingConfigId.value = config.id
  sheetOpen.value = true
}

const handleTest = (config: LLMConfigResponse) => {
  router.push({ name: 'aiConfigTest', params: { id: config.id } })
}

const handleClose = () => {
  sheetOpen.value = false
  editingConfigId.value = null
  resetForm()
}

const handleSave = async () => {
  const success = await saveConfig(editingConfigId.value)
  if (success) {
    handleClose()
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-muted/20">
    <div class="p-6 lg:p-8 max-w-[1440px] mx-auto">
      <!-- 页面头部 -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Settings class="h-4 w-4" />
            <span>系统设置</span>
            <span class="text-border">/</span>
            <span class="text-foreground font-medium">AI 配置</span>
          </div>
          <h1 class="text-2xl font-semibold tracking-tight">AI 模型配置</h1>
          <p class="text-muted-foreground text-sm">管理 LLM 提供商连接与参数设置</p>
        </div>
        <Button 
          class="shrink-0 shadow-sm hover:shadow-md transition-shadow" 
          @click="handleAdd"
        >
          <Plus class="h-4 w-4 mr-1.5" />
          添加配置
        </Button>
      </div>

      <!-- 配置列表 -->
      <Card class="border-border/60 shadow-sm">
        <CardHeader class="border-b bg-muted/30">
          <CardTitle class="text-base flex items-center gap-2 text-foreground/90">
            <Sparkles class="h-4 w-4 text-primary" />
            LLM 配置列表
            <span 
              v-if="aiStore.configs.length > 0" 
              class="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
            >
              {{ aiStore.configs.length }}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent class="p-6">
          <!-- 加载状态 -->
          <div v-if="aiStore.isLoading || loading" class="py-16 flex flex-col items-center justify-center gap-3">
            <div class="relative">
              <div class="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary"></div>
              <div class="absolute inset-0 animate-pulse rounded-full h-10 w-10 bg-primary/5"></div>
            </div>
            <span class="text-sm text-muted-foreground">加载配置中...</span>
          </div>

          <!-- 空状态 -->
          <div
            v-else-if="aiStore.configs.length === 0"
            class="py-16 flex flex-col items-center justify-center text-center"
          >
            <div class="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
              <Sparkles class="h-8 w-8 text-primary/40" />
            </div>
            <h3 class="text-base font-medium text-foreground mb-1">暂无 AI 配置</h3>
            <p class="text-sm text-muted-foreground mb-5 max-w-xs">
              添加 LLM 提供商配置，开始使用 AI 辅助功能
            </p>
            <Button variant="outline" class="gap-1.5" @click="handleAdd">
              <Plus class="h-4 w-4" />
              创建首个配置
            </Button>
          </div>

          <!-- 配置卡片网格 -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <ConfigCard
              v-for="(config, index) in aiStore.configs"
              :key="config.id"
              :config="config"
              :is-editing="sheetOpen"
              :deleting-id="deletingId"
              :action-loading-id="actionLoadingId"
              :style="{ animationDelay: `${index * 50}ms` }"
              class="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-backwards"
              @edit="handleEdit"
              @delete="deleteConfig"
              @set-default="setDefault"
              @set-active="setActive"
              @test="handleTest"
            />
          </div>
        </CardContent>
      </Card>

      <!-- 编辑/添加抽屉 -->
      <Sheet v-model:open="sheetOpen">
        <SheetContent class="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader class="space-y-2 pb-4 border-b">
            <SheetTitle class="text-lg">{{ sheetTitle }}</SheetTitle>
            <SheetDescription class="text-sm text-muted-foreground">
              {{ sheetDescription }}
            </SheetDescription>
          </SheetHeader>
          <div class="mt-6 pl-2.5 pr-2.5">
            <ConfigForm
              v-model:config-form="configForm"
              :editing-config-id="editingConfigId"
              :saving="saving"
              @save="handleSave"
              @cancel="handleClose"
              @apply-defaults="applyProviderDefaults"
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  </div>
</template>
