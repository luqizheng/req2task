<script setup lang="ts" generic="T extends string">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { EnumConfigMap } from '@/utils/enum-config'
import { toSelectOptions } from '@/utils/enum-config'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: T
    config: EnumConfigMap<T>
    placeholder?: string
    includeAll?: boolean
    allLabel?: string
    class?: string
  }>(),
  {
    placeholder: '请选择',
    includeAll: false,
    allLabel: '全部',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: T | undefined]
}>()

const options = computed(() => toSelectOptions(props.config))

const handleChange = (val: unknown) => {
  emit('update:modelValue', (val as T) || undefined)
}
</script>

<template>
  <Select
    :model-value="(modelValue as string | undefined) ?? ''"
    @update:model-value="handleChange"
  >
    <SelectTrigger :class="props.class">
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-if="includeAll" value="">
        {{ allLabel }}
      </SelectItem>
      <SelectItem
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
