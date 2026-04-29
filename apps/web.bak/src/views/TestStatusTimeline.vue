<template>
  <div class="test-container">
    <h1>RawRequirement 状态流转测试</h1>
    
    <div class="test-section">
      <h2>已完成状态</h2>
      <RawRequirementStatusTimeline
        :current-status="RawRequirementStatus.COMPLETED"
        :created-at="'2024-03-15T09:00:00Z'"
      />
    </div>
    
    <div class="test-section">
      <h2>澄清中状态</h2>
      <RawRequirementStatusTimeline
        :current-status="RawRequirementStatus.CLARIFIED"
        :created-at="'2024-03-15T09:00:00Z'"
      />
    </div>
    
    <div class="test-section">
      <h2>处理中状态</h2>
      <RawRequirementStatusTimeline
        :current-status="RawRequirementStatus.PROCESSING"
        :created-at="'2024-03-15T09:00:00Z'"
      />
    </div>
    
    <div class="test-section">
      <h2>待处理状态</h2>
      <RawRequirementStatusTimeline
        :current-status="RawRequirementStatus.PENDING"
        :created-at="'2024-03-15T09:00:00Z'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import RawRequirementStatusTimeline from "@/components/business/RawRequirementStatusTimeline.vue";
import { RawRequirementStatus } from "@req2task/dto";
</script>

<style scoped>
.test-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin: 40px 0;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background-color: #fff;
}

.test-section h2 {
  margin-bottom: 20px;
  font-size: 18px;
  color: #303133;
}
</style>