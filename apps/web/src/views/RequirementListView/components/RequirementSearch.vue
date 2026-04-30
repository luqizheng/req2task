<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: []
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleKeyup = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    emit('search')
  }
}
</script>

<template>
  <div class="relative w-full max-w-sm">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <Input
      :model-value="modelValue"
      placeholder="搜索需求标题..."
      class="pl-10"
      @input="handleInput"
      @keyup="handleKeyup"
    />
  </div>
</template>
