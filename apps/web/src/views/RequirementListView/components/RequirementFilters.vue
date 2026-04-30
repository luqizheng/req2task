<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RequirementStatus, Priority } from '@req2task/dto'
import type { Filters } from '../store'

const props = defineProps<{
  filters: Filters
}>()

const emit = defineEmits<{
  'update:filters': [filters: Filters]
  clear: []
}>()

const statusOptions = [
  { value: RequirementStatus.DRAFT, label: '草稿' },
  { value: RequirementStatus.REVIEWED, label: '已审查' },
  { value: RequirementStatus.APPROVED, label: '已批准' },
  { value: RequirementStatus.REJECTED, label: '已拒绝' },
  { value: RequirementStatus.PROCESSING, label: '处理中' },
  { value: RequirementStatus.COMPLETED, label: '已完成' },
  { value: RequirementStatus.CANCELLED, label: '已取消' }
]

const priorityOptions = [
  { value: Priority.CRITICAL, label: '紧急' },
  { value: Priority.HIGH, label: '高' },
  { value: Priority.MEDIUM, label: '中' },
  { value: Priority.LOW, label: '低' }
]

const updateFilter = (key: keyof Filters, value: string) => {
  emit('update:filters', { ...props.filters, [key]: value || '' })
}

const hasActiveFilters = computed(() => {
  return props.filters.status || props.filters.priority
})

const removeStatusFilter = () => {
  emit('update:filters', { ...props.filters, status: '' })
}

const removePriorityFilter = () => {
  emit('update:filters', { ...props.filters, priority: '' })
}

import { computed } from 'vue'
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <Select
      :model-value="filters.status"
      @update:model-value="(val) => updateFilter('status', val as string)"
    >
      <SelectTrigger class="w-[160px]">
        <SelectValue placeholder="状态筛选" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </SelectItem>
      </SelectContent>
    </Select>

    <Select
      :model-value="filters.priority"
      @update:model-value="(val) => updateFilter('priority', val as string)"
    >
      <SelectTrigger class="w-[140px]">
        <SelectValue placeholder="优先级筛选" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="opt in priorityOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </SelectItem>
      </SelectContent>
    </Select>

    <div v-if="hasActiveFilters" class="flex items-center gap-2">
      <Badge v-if="filters.status" variant="secondary" class="gap-1 px-2 py-1">
        {{ statusOptions.find(o => o.value === filters.status)?.label }}
        <X class="w-3 h-3 cursor-pointer" @click="removeStatusFilter" />
      </Badge>
      <Badge v-if="filters.priority" variant="secondary" class="gap-1 px-2 py-1">
        {{ priorityOptions.find(o => o.value === filters.priority)?.label }}
        <X class="w-3 h-3 cursor-pointer" @click="removePriorityFilter" />
      </Badge>
      <Button variant="ghost" size="sm" class="h-7 text-xs" @click="emit('clear')">
        清除筛选
      </Button>
    </div>
  </div>
</template>
