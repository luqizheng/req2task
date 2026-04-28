<template>
  <div class="raw-requirement-detail">
    <div class="main-column">
      <el-card class="card" shadow="never">
        <template #header>
          <div style="display: flex; flex-direction: row; align-items: center">
            <h1 style="flex: 9">需求内容</h1>
            <RawRequirementStatusTag
              :status="rawRequirement.status"
              v-if="rawRequirement"
              effect="light"
              >{{
                useRawRequirementStatus(rawRequirement.status)
              }}</RawRequirementStatusTag
            >
          </div>
        </template>
        {{ rawRequirement?.content || "-" }}
        <template #footer>
          <InfoItem :items="infoItems"> </InfoItem>
        </template>
      </el-card>

      <el-card class="card" shadow="never">
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
        <el-card class="card" shadow="never">
          <template #header>
            <div
              style="display: flex; flex-direction: row; align-items: center"
            >
              <h1 style="flex: 9">状态流转</h1>
            </div>
          </template>
          <!-- 状态流转组件 -->
          <RawRequirementStatusTimeline
            v-if="rawRequirement"
            :current-status="rawRequirement.status"
            :created-at="rawRequirement.createdAt"
          />
        </el-card>

     
          <AttachmentsList :attachments="attachments" />
   
        
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useRawRequirement } from "./useRawRequirement";
import QACardList from "./_QACardList.vue";
import RawRequirementStatusTag from "@/components/business/RawRequirementStatusTag.vue";
import RawRequirementStatusTimeline from "@/components/business/RawRequirementStatusTimeline.vue";
import AttachmentsList from "@/components/business/AttachmentsList.vue";

import InfoItem from "@/components/common/InfoItem.vue";
import { useRawRequirementStatus } from "@/utils/useRawRequirement";
import { ref } from "vue";
import { AttachmentResponseDto, AttachmentTargetType } from "@req2task/dto";


// 生成Attachment demo数据 (模拟AttachmentResponseDto结构)
const generateDemoAttachments = () => {
  const demoFiles = [
    { name: '需求规格说明书.docx', size: 1024 * 1024 * 2, type: 'application/msword', url: '#', id: '1' },
    { name: '系统架构设计图.png', size: 1024 * 500, type: 'image/png', url: '#', id: '2' },
    { name: '用户故事列表.xlsx', size: 1024 * 1024 * 1.5, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', url: '#', id: '3' }
  ];
  return demoFiles.map(file => ({
    id: file.id,
    displayName: file.name,
    fileDataId: file.id,
    targetType: AttachmentTargetType.REQUIREMENT,
    targetId:'ll',
    size: file.size,
    mimeType: file.type,
    storagePath: file.url,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString()
  } as any as AttachmentResponseDto));
};

const attachments= ref(generateDemoAttachments())


const { rawRequirement, infoItems } =
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
  /* background-color: #f5f7fa; */
  border-radius: 8px;
  overflow: hidden;
  padding:4px;
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
  /* background-color: #ffffff; */
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
