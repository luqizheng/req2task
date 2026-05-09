<script setup lang="ts">
import { ProjectStatus } from '@req2task/dto'
import { PROJECT_STATUS_CONFIG } from '@/utils/enum-config'
import EnumSelect from '@/components/common/EnumSelect.vue'

defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <EnumSelect
    :model-value="(modelValue as ProjectStatus | undefined)"
    :config="PROJECT_STATUS_CONFIG"
    placeholder="项目状态"
    include-all
    all-label="全部状态"
    class="w-[140px]"
    @update:model-value="(v) => emit('update:modelValue', (v as string) ?? '')"
  />
</template>
