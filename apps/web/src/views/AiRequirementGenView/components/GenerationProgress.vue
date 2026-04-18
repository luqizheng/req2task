<script setup lang="ts">
import type { GenerationStep } from '../composables';

defineProps<{
  steps: GenerationStep[];
  currentStep: number;
}>();
</script>

<template>
  <el-card v-if="currentStep > 0" class="generation-progress-card">
    <template #header>
      <span class="card-title">生成进度</span>
    </template>

    <el-steps :active="currentStep" direction="vertical">
      <el-step
        v-for="step in steps"
        :key="step.key"
        :title="step.label"
        :status="step.status"
      />
    </el-steps>
  </el-card>
</template>

<style scoped>
.generation-progress-card {
  margin-bottom: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}
</style>
