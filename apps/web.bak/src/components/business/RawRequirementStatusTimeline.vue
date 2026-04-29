<template>
  <div class="status-timeline">
    <h3>状态流转</h3>
    <el-timeline>
      <el-timeline-item
        v-for="(item, index) in statusHistory"
        :key="index"
        :timestamp="formatDate(item.timestamp)"
        :color="getStatusColor(item.status)"
      >
        {{ getStatusLabel(item.status) }}
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import dayjs from "dayjs";
import { RawRequirementStatus } from "@req2task/dto";
import { useRawRequirementStatus } from "@/utils/useRawRequirement";

interface StatusHistoryItem {
  status: RawRequirementStatus;
  timestamp: string;
}

const props = defineProps<{
  currentStatus: RawRequirementStatus;
  createdAt: string;
}>();

// 模拟状态历史数据
const statusHistory = computed<StatusHistoryItem[]>(() => {
  const history: StatusHistoryItem[] = [];
  
  // 从已完成开始，按时间倒序排列
  if (props.currentStatus === RawRequirementStatus.COMPLETED) {
    history.push({
      status: RawRequirementStatus.COMPLETED,
      timestamp: dayjs(props.createdAt).add(1, 'day').format('YYYY-MM-DD HH:mm'),
    });
  }
  
  if ([RawRequirementStatus.COMPLETED, RawRequirementStatus.CLARIFIED].includes(props.currentStatus)) {
    history.push({
      status: RawRequirementStatus.CLARIFIED,
      timestamp: dayjs(props.createdAt).add(8, 'hour').format('YYYY-MM-DD HH:mm'),
    });
  }
  
  if ([RawRequirementStatus.COMPLETED, RawRequirementStatus.CLARIFIED, RawRequirementStatus.PROCESSING].includes(props.currentStatus)) {
    history.push({
      status: RawRequirementStatus.PROCESSING,
      timestamp: dayjs(props.createdAt).add(6, 'hour').format('YYYY-MM-DD HH:mm'),
    });
  }
  
  // 总是添加初始状态
  history.push({
    status: RawRequirementStatus.PENDING,
    timestamp: props.createdAt,
  });
  
  return history;
});

const getStatusLabel = (status: RawRequirementStatus) => {
  return useRawRequirementStatus(status);
};

const getStatusColor = (status: RawRequirementStatus) => {
  const colorMap: Record<RawRequirementStatus, string> = {
    [RawRequirementStatus.PENDING]: '#f59e0b',
    [RawRequirementStatus.PROCESSING]: '#6366f1',
    [RawRequirementStatus.COMPLETED]: '#10b981',
    [RawRequirementStatus.CLARIFIED]: '#13c2c2',
    [RawRequirementStatus.CONVERTED]: '#8b5cf6',
    [RawRequirementStatus.DISCARDED]: '#6b7280',
    [RawRequirementStatus.FAILED]: '#ef4444',
  };
  
  return colorMap[status] || '#6366f1';
};

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};
</script>

<style scoped>
.status-timeline {
  margin: 20px 0;
}

.status-timeline h3 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
</style>