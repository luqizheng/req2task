<script setup lang="ts">
import { LLMProviderType } from '@req2task/dto'
import { LLM_PROVIDER_TYPE_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: LLMProviderType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: LLMProviderType]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="LLM_PROVIDER_TYPE_CONFIG"
    placeholder="LLM提供商"
    class="w-32 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as LLMProviderType)"
  />
</template>
