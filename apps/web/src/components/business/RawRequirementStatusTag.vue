<!-- 自定义封装组件 MyTag.vue -->
<template>
  <el-tag :type="resolvedType" effect="light" :color="resolvedColor">
    <slot />
  </el-tag>
</template>

<script setup lang="ts">
import { RawRequirementStatus } from '@req2task/dto'
import { computed } from 'vue'

const props = defineProps<{
    status: RawRequirementStatus
}>()

// 状态到颜色的映射
const statusColorMap = {
  [RawRequirementStatus.PENDING]: '#f59e0b', // warning
  [RawRequirementStatus.PROCESSING]: '#6366f1', // info
  [RawRequirementStatus.COMPLETED]: '#10b981', // success
  [RawRequirementStatus.CLARIFIED]: '#13c2c2', // cyan
  [RawRequirementStatus.CONVERTED]: '#8b5cf6', // secondary
  [RawRequirementStatus.DISCARDED]: '#6b7280', // neutral
  [RawRequirementStatus.FAILED]: '#ef4444' // danger
}

// 状态到类型的映射
const statusTypeMap = {
  [RawRequirementStatus.PENDING]: 'warning',
  [RawRequirementStatus.PROCESSING]: 'info',
  [RawRequirementStatus.COMPLETED]: 'success',
  [RawRequirementStatus.CLARIFIED]: 'info',
  [RawRequirementStatus.CONVERTED]: 'success',
  [RawRequirementStatus.DISCARDED]: 'info',
  [RawRequirementStatus.FAILED]: 'danger'
}

const resolvedType = computed(() => statusTypeMap[props.status] || 'info')
const resolvedColor = computed(() => statusColorMap[props.status] || '')
</script>
