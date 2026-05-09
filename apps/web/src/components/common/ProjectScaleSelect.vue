<script setup lang="ts">
import { ProjectScale } from '@req2task/dto'
import { PROJECT_SCALE_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: ProjectScale
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ProjectScale]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="PROJECT_SCALE_CONFIG"
    placeholder="项目规模"
    class="w-24 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as ProjectScale)"
  />
</template>
