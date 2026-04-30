<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Play } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAiStore } from '@/stores/ai'
import { llmConfigApi } from '@/api/llm-config'
import type { LLMConfigResponse } from '@/api/llm-config'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const aiStore = useAiStore()

const configId = ref<string>((route.params.id as string) || '')
const testMessage = ref('请回复"配置测试成功"以确认连接正常。')
const testing = ref(false)

interface TestResultType {
  success: boolean
  content: string
  latencyMs?: number
  error?: string
}

const testResult = ref<TestResultType | null>(null)

const selectedConfig = computed<LLMConfigResponse | undefined>(() => {
  return aiStore.configs.find(c => c.id === configId.value)
})

const configOptions = computed(() => {
  return aiStore.configs.map(c => ({
    value: c.id,
    label: `${c.name} (${c.provider}/${c.modelName})`,
    disabled: !c.isActive,
  }))
})

const handleTest = async () => {
  if (!configId.value) {
    toast.warning('请先选择要测试的配置')
    return
  }

  testing.value = true
  testResult.value = null

  try {
    const response = await llmConfigApi.testConfig(configId.value, testMessage.value)
    let result = response
    if (result && typeof result === 'object' && 'data' in result) {
      result = (result as { data: typeof response }).data
    }
    if (result) {
      testResult.value = {
        success: result.success ?? false,
        content: result.content ?? '',
        latencyMs: result.latencyMs,
        error: result.error,
      }

      if (result.success) {
        toast.success('测试成功')
      } else {
        toast.error(result.error || '测试失败')
      }
    }
  } catch (error) {
    testResult.value = {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : '测试请求失败',
    }
    toast.error('测试请求失败')
  } finally {
    testing.value = false
  }
}

const handleGoBack = () => {
  router.push('/ai/config')
}

onMounted(async () => {
  if (aiStore.configs.length === 0) {
    await aiStore.fetchConfigs()
  }

  if (configId.value && !selectedConfig.value) {
    toast.warning('未找到对应的配置')
  }
})
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <Button variant="ghost" size="sm" @click="handleGoBack">
        <ArrowLeft class="h-4 w-4 mr-1" />
        返回配置列表
      </Button>
      <h2 class="text-xl font-semibold">LLM 配置测试</h2>
    </div>

    <Card>
      <CardHeader>
        <CardTitle class="text-base flex items-center gap-2">
          <Play class="h-4 w-4" />
          测试 LLM 配置
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="aiStore.isLoading" class="py-12 flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>

        <div v-else class="space-y-5 max-w-xl">
          <div class="space-y-2">
            <label class="text-sm font-medium">选择配置</label>
            <Select v-model="configId">
              <SelectTrigger>
                <SelectValue placeholder="请选择要测试的配置" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in configOptions"
                  :key="option.value"
                  :value="option.value"
                  :disabled="option.disabled"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div v-if="selectedConfig" class="flex flex-wrap gap-2">
            <Badge variant="secondary">提供商: {{ selectedConfig.provider }}</Badge>
            <Badge variant="secondary">模型: {{ selectedConfig.modelName }}</Badge>
            <Badge v-if="selectedConfig.baseUrl" variant="secondary">
              Base URL: {{ selectedConfig.baseUrl }}
            </Badge>
            <Badge variant="secondary">最大Token: {{ selectedConfig.maxTokens }}</Badge>
            <Badge variant="secondary">温度: {{ selectedConfig.temperature }}</Badge>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">测试消息</label>
            <Textarea
              v-model="testMessage"
              rows="4"
              placeholder="输入测试消息"
            />
          </div>

          <Button
            :loading="testing"
            :disabled="!configId"
            @click="handleTest"
          >
            <Play v-if="!testing" class="h-4 w-4 mr-1" />
            发送测试
          </Button>
        </div>

        <div v-if="testResult" class="mt-8">
          <div class="h-px bg-border my-6"></div>

          <Card :class="testResult.success ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'">
            <CardHeader class="pb-3">
              <div class="flex items-center justify-between">
                <span :class="testResult.success ? 'text-green-600' : 'text-red-600'" class="font-medium">
                  {{ testResult.success ? '✓ 测试成功' : '✗ 测试失败' }}
                </span>
                <Badge v-if="testResult.latencyMs" variant="outline">
                  响应时间: {{ testResult.latencyMs }}ms
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div v-if="testResult.success" class="space-y-2">
                <p class="text-sm font-medium">AI 响应:</p>
                <div class="bg-muted p-3 rounded-md font-mono text-sm whitespace-pre-wrap">
                  {{ testResult.content }}
                </div>
              </div>

              <div v-else class="space-y-2">
                <p class="text-sm font-medium">错误信息:</p>
                <div class="bg-red-100 p-3 rounded-md font-mono text-sm text-red-700 whitespace-pre-wrap">
                  {{ testResult.error }}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
