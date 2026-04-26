<template>
  <el-card class="qa-card" shadow="never">
    <template #header>
      <div style="display: flex; flex-direction: row; align-items: center">
        <h1 style="flex: 9">澄清问答</h1>
        <AppBadge :value="props.qaList.length" type="info" />
      </div>
    </template>
    <RawRequirementQA
      v-for="(qa, index) in props.qaList"
      :key="index"
      :qa="qa"
      :index="index"
    />
  </el-card>
</template>
<script setup lang="ts">
import { RawRequirementQADto } from "@req2task/dto";
import RawRequirementQA from "./_QACardItem.vue";
import { AppBadge } from "@/components/common";
const props = defineProps<{
  qaList: RawRequirementQADto[];
}>();
</script>
