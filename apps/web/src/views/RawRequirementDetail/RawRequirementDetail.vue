<template>
  <div class="raw-requirement-detail">
    <div class="main-column">
      <div class="content-wrapper">
        <h1>需求详情</h1>
        <!-- 主要内容区域 -->
      </div>
    </div>
    <div class="left-column">
      <div class="sidebar-wrapper">
        <h2>需求信息</h2>
        <!-- 侧边栏内容区域 -->
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { useRawRequirement } from "./useRawRequirement";

const router = useRoute();

const { rawRequirement, loading, error, fetchRawRequirement } =
  useRawRequirement(router.params.id);
</script>

<style scoped>
.raw-requirement-detail {
  display: flex;
  gap: 20px;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.main-column {
  flex: 7;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

.content-wrapper {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.left-column {
  flex: 3;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.sidebar-wrapper {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
