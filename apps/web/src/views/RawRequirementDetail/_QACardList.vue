<template>
  <el-card class="qa-card">
    <template #header>
      <div style="display: flex; flex-direction: row; align-items: center">
        <h1 style="flex: 9">澄清问答</h1>
        <span class="qa-count">
          {{ qaList.length }}
        </span>
      </div>
    </template>
    <RawRequirementQA
      v-for="(qa, index) in qaList"
      :key="index"
      :qa="qa"
      :index="index"
    />
  </el-card>
</template>
<script setup lang="ts">
import { RawRequirementQADto } from "@req2task/dto";
import RawRequirementQA from "@/components/business/RawRequirementQA.vue";
import { AppBadge } from '@/components/common';
const props = defineProps<{
  qaList: RawRequirementQADto[];
}>();
</script>
