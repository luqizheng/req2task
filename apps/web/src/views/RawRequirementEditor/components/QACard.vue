<script setup lang="ts">
import type { RawRequirementQADto } from '@req2task/dto'
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Check, Minus, Circle } from 'lucide-vue-next'

type QAStatus = 'pending' | 'answered' | 'skipped'

interface Props {
  data: RawRequirementQADto
  index: number
  class?: string
}

const props = defineProps<Props>()

const emits = defineEmits<{
  (e: 'submit', id: string, answer: string): void
  (e: 'skip', id: string): void
}>()

const answerInput = ref('')

const status = computed<QAStatus>(() => {
  if (props.data.answeredAt) return 'answered'
  if (props.data.answer === null && props.data.answeredAt === null && answerInput.value === '') {
    // 初始状态，没有回答也没有跳过标记
    return 'pending'
  }
  // 如果 answer 为 null 且已有某种记录，视为跳过
  if (props.data.answer === null) return 'skipped'
  return 'pending'
})

const statusConfig = computed(() => {
  switch (status.value) {
    case 'answered':
      return {
        borderColor: 'border-green-500',
        bgColor: 'bg-white',
        iconColor: 'bg-green-100 text-green-600',
        badgeColor: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
        badgeText: '已回答',
        purposeBg: 'bg-gray-50',
        answerBg: 'bg-green-50 text-green-700',
        icon: Check,
      }
    case 'skipped':
      return {
        borderColor: 'border-yellow-500',
        bgColor: 'bg-white',
        iconColor: 'bg-yellow-100 text-yellow-600',
        badgeColor: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-50',
        badgeText: '已跳过',
        purposeBg: 'bg-gray-50',
        answerBg: 'bg-yellow-50 text-yellow-700',
        icon: Minus,
      }
    default:
      return {
        borderColor: 'border-blue-500',
        bgColor: 'bg-blue-50/30',
        iconColor: 'bg-blue-100 text-blue-600',
        badgeColor: 'bg-blue-50 text-blue-600 hover:bg-blue-50',
        badgeText: '待回答',
        purposeBg: 'bg-blue-50/50',
        answerBg: '',
        icon: Circle,
      }
  }
})

const questionNumber = computed(() => `Q${props.index + 1}`)

function handleSubmit() {
  if (answerInput.value.trim()) {
    emits('submit', props.data.id, answerInput.value.trim())
  }
}

function handleSkip() {
  emits('skip', props.data.id)
}
</script>

<template>
  <Card
    :class="cn(
      'border-2 transition-all',
      statusConfig.borderColor,
      statusConfig.bgColor,
      props.class,
    )"
  >
    <CardContent class="p-5 space-y-4">
      <!-- Header: Icon + Question Number + Status Badge -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            :class="cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
              statusConfig.iconColor,
            )"
          >
            <component :is="statusConfig.icon" class="w-3.5 h-3.5" />
          </div>
          <span class="font-semibold text-gray-900">{{ questionNumber }}</span>
        </div>
        <Badge
          variant="secondary"
          :class="cn('text-xs font-medium', statusConfig.badgeColor)"
        >
          {{ statusConfig.badgeText }}
        </Badge>
      </div>

      <!-- Question Content -->
      <p class="text-gray-900 text-base leading-relaxed">
        {{ data.question }}
      </p>

      <!-- Purpose -->
      <div
        v-if="data.purpose"
        :class="cn(
          'text-sm text-gray-600 px-3 py-2 rounded-md',
          statusConfig.purposeBg,
        )"
      >
        目的：{{ data.purpose }}
      </div>

      <!-- Answer Section (Answered State) -->
      <div
        v-if="status === 'answered' && data.answer"
        :class="cn(
          'text-sm px-3 py-3 rounded-md leading-relaxed',
          statusConfig.answerBg,
        )"
      >
        {{ data.answer }}
      </div>

      <!-- Skipped Section (Skipped State) -->
      <div
        v-if="status === 'skipped'"
        :class="cn(
          'text-sm px-3 py-3 rounded-md flex items-center gap-2',
          statusConfig.answerBg,
        )"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
        此问题已跳过，将在下次提交时保留
      </div>

      <!-- Input Section (Pending State) -->
      <template v-if="status === 'pending'">
        <Textarea
          v-model="answerInput"
          placeholder="请输入您的回答..."
          class="min-h-[80px] resize-none bg-white"
        />

        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            class="text-gray-600"
            @click="handleSkip"
          >
            跳过
          </Button>
          <Button
            size="sm"
            class="bg-blue-600 hover:bg-blue-700 text-white"
            :disabled="!answerInput.trim()"
            @click="handleSubmit"
          >
            提交回答
          </Button>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
