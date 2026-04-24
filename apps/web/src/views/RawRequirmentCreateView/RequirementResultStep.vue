<script setup lang="ts">
import { useRouter } from "vue-router";
import { View, Refresh, Check } from "@element-plus/icons-vue";
import { useRawRequirementCreateStore } from "./store";

interface Props {
  store: ReturnType<typeof useRawRequirementCreateStore>;
}

const props = defineProps<Props>();
const router = useRouter();

const getPriorityType = (priority: string) => {
  const map: Record<string, string> = {
    critical: "danger",
    high: "warning",
    medium: "primary",
    low: "info",
  };
  return map[priority.toLowerCase()] || "info";
};

const getPriorityLabel = (priority: string) => {
  const map: Record<string, string> = {
    critical: "紧急",
    high: "高",
    medium: "中",
    low: "低",
  };
  return map[priority.toLowerCase()] || priority;
};

const handleViewDetail = () => {
  if (props.store.generatedRequirement?.id) {
    router.push({
      name: "requirementDetail",
      params: { id: props.store.generatedRequirement.id },
    });
  }
};

const handleContinue = () => {
  props.store.reset();
};
</script>

<template>
  <div class="requirement-result-step">
    <div class="success-banner">
      <el-icon class="success-icon"><Check /></el-icon>
      <h3>需求生成成功！</h3>
      <p>以下是 AI 根据您的需求和问答信息生成的需求详情</p>
    </div>

    <div
      v-if="store.generatedRequirement"
      class="requirement-detail"
    >
      <div class="detail-header">
        <h2 class="requirement-title">
          {{ store.generatedRequirement.title }}
        </h2>
        <el-tag :type="getPriorityType(store.generatedRequirement.priority)">
          {{ getPriorityLabel(store.generatedRequirement.priority) }}
        </el-tag>
      </div>

      <div class="detail-section">
        <h4>需求描述</h4>
        <div class="description-content">
          {{ store.generatedRequirement.description || "暂无描述" }}
        </div>
      </div>

      <div
        v-if="
          store.generatedRequirement.acceptanceCriteria &&
          store.generatedRequirement.acceptanceCriteria.length > 0
        "
        class="detail-section"
      >
        <h4>验收标准</h4>
        <ul class="criteria-list">
          <li
            v-for="(criteria, index) in store.generatedRequirement.acceptanceCriteria"
            :key="index"
          >
            {{ criteria }}
          </li>
        </ul>
      </div>

      <div
        v-if="
          store.generatedRequirement.userStories &&
          store.generatedRequirement.userStories.length > 0
        "
        class="detail-section"
      >
        <h4>用户故事</h4>
        <div class="user-stories">
          <div
            v-for="(story, index) in store.generatedRequirement.userStories"
            :key="index"
            class="user-story-item"
          >
            <div class="story-header">
              <span class="story-role">作为 {{ story.role }}</span>
            </div>
            <div class="story-content">
              <span class="story-goal">我想要 {{ story.goal }}</span>
              <span class="story-benefit">以便 {{ story.benefit }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="action-buttons">
      <el-button
        type="primary"
        :icon="View"
        size="large"
        @click="handleViewDetail"
      >
        查看详情
      </el-button>
      <el-button
        :icon="Refresh"
        size="large"
        @click="handleContinue"
      >
        继续添加
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.requirement-result-step {
  max-width: 700px;
  margin: 0 auto;
}

.success-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 12px;
  margin-bottom: 24px;
}

.success-icon {
  font-size: 48px;
  color: #10b981;
  margin-bottom: 16px;
}

.success-banner h3 {
  font-size: 20px;
  font-weight: 600;
  color: #166534;
  margin: 0 0 8px 0;
}

.success-banner p {
  font-size: 14px;
  color: #15803d;
  margin: 0;
}

.requirement-detail {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.requirement-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  flex: 1;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.description-content {
  font-size: 14px;
  color: #1e293b;
  line-height: 1.7;
  white-space: pre-wrap;
}

.criteria-list {
  margin: 0;
  padding-left: 20px;
}

.criteria-list li {
  font-size: 14px;
  color: #1e293b;
  line-height: 1.6;
  margin-bottom: 8px;
}

.criteria-list li:last-child {
  margin-bottom: 0;
}

.user-stories {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-story-item {
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #6366f1;
}

.story-header {
  margin-bottom: 8px;
}

.story-role {
  font-weight: 600;
  color: #6366f1;
  font-size: 13px;
}

.story-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}

.story-goal {
  color: #1e293b;
}

.story-benefit {
  color: #64748b;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}
</style>
