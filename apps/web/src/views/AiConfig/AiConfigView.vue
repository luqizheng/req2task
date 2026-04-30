<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Settings } from 'lucide-vue-next'
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
  <div class="p-6 max-w-[1400px] mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold">AI 配置管理</h2>
      <Button @click="handleAdd">
        <Plus class="h-4 w-4 mr-1" />
        添加配置
      </Button>
    </div>

    <Card>
      <CardHeader>
        <CardTitle class="text-base flex items-center gap-2">
          <Settings class="h-4 w-4" />
          LLM 配置列表
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="aiStore.isLoading || loading" class="py-12 flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>

        <div
          v-else-if="aiStore.configs.length === 0"
          class="py-12 text-center"
        >
          <div class="text-muted-foreground mb-4">暂无AI配置，请点击添加按钮创建</div>
          <Button @click="handleAdd">添加配置</Button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ConfigCard
            v-for="config in aiStore.configs"
            :key="config.id"
            :config="config"
            :is-editing="sheetOpen"
            :deleting-id="deletingId"
            :action-loading-id="actionLoadingId"
            @edit="handleEdit"
            @delete="deleteConfig"
            @set-default="setDefault"
            @set-active="setActive"
            @test="handleTest"
          />
        </div>
      </CardContent>
    </Card>

    <Sheet v-model:open="sheetOpen" > 
      <SheetContent class="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{{ sheetTitle }}</SheetTitle>
        </SheetHeader>
        <div class="mt-6 p-2.5">
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
</template>
