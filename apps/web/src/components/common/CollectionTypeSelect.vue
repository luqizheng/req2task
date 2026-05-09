<script setup lang="ts">
import { CollectionType } from '@req2task/dto'
import { COLLECTION_TYPE_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: CollectionType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CollectionType]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="COLLECTION_TYPE_CONFIG"
    placeholder="采集方式"
    class="w-28 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as CollectionType)"
  />
</template>
