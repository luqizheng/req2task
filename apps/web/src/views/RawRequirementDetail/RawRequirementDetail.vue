<template>
  <div class="raw-requirement-detail">
    <div class="main-column">
      <el-card class="card">
        <template #header>
          <div style="display: flex; flex-direction: row; align-items: center">
            <h1 style="flex: 9">需求内容</h1>
            <RawRequirementStatusTag :status="rawRequirement.status"  v-if="rawRequirement" effect="light">{{
              useRawRequirementStatus(rawRequirement.status)
            }}</RawRequirementStatusTag>
          </div>
        </template>
        {{ rawRequirement?.content || "-" }}
        <template #footer>
          <InfoItem :items="infoItems"> </InfoItem>
        </template>
      </el-card>

      <el-card class="card">
        <template #header>
          <div style="display: flex; flex-direction: row; align-items: center">
            <h1 style="flex: 9">关键要素</h1>
          </div>
        </template>

        <el-tag
          v-for="(element, index) in rawRequirement?.keyElements"
          :key="index"
          type="info"
          effect="light"
          class="mr-2 mb-2"
        >
          {{ element }}
        </el-tag>
        <span
          v-if="
            !rawRequirement?.keyElements ||
            rawRequirement.keyElements.length === 0
          "
          >无</span
        >
      </el-card>
      <QACardList :qaList="rawRequirement?.questionAndAnswers || []" />
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
import { useRawRequirement } from "./useRawRequirement";
import QACardList from "./_QACardList.vue";
import RawRequirementStatusTag from "@/components/business/RawRequirementStatusTag.vue";

import InfoItem from "@/components/common/InfoItem.vue";
import { useRawRequirementStatus } from "@/utils/useRawRequirement";

const { rawRequirement, infoItems, loading, error, fetchRawRequirement } =
  useRawRequirement();
</script>
<style></style>
<style scoped>
.card {
  margin-bottom: 20px;
}
.raw-requirement-detail {
  display: flex;
  gap: 20px;
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
