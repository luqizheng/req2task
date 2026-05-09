<script setup lang="ts">
import { CloudProvider } from '@req2task/dto'
import { CLOUD_PROVIDER_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: CloudProvider
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CloudProvider]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="CLOUD_PROVIDER_CONFIG"
    placeholder="云服务商"
    class="w-28 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as CloudProvider)"
  />
</template>
