<script setup lang="ts">
import { computed } from "vue";
import { Document, List, Check, User } from "@element-plus/icons-vue";
import { StatCard } from "@/components/common";
import type { ProjectResponseDto } from "@req2task/dto";

type ViewMode = "admin" | "developer" | "tester" | "product";

interface StatItem {
  key: string;
  title: string;
  value: number | string;
  icon: any;
  color: string;
  clickable?: boolean;
}

interface Props {
  project: ProjectResponseDto | null;
  requirementCount?: number;
  taskCount?: number;
  completedTaskCount?: number;
  viewMode?: ViewMode;
}

const props = withDefaults(defineProps<Props>(), {
  requirementCount: 0,
  taskCount: 0,
  completedTaskCount: 0,
  viewMode: "admin",
});

const emit = defineEmits<{
  requirementsClick: [];
}>();

const completionRate = computed(() => {
  if (props.taskCount === 0) return 0;
  return Math.round((props.completedTaskCount / props.taskCount) * 100);
});

const memberCount = computed(() => {
  return props.project?.members?.length || 0;
});

const stats = computed(() => {
  const base: StatItem[] = [
    {
      key: "requirements",
      title: "需求总数",
      value: props.requirementCount,
      icon: Document,
      color: "#2563eb",
      clickable: true,
    },
    {
      key: "tasks",
      title: "任务总数",
      value: props.taskCount,
      icon: List,
      color: "#2563eb",
    },
    {
      key: "members",
      title: "成员数量",
      value: memberCount.value,
      icon: User,
      color: "#f59e0b",
    },
  ];

  let filteredStats = base;
  if (props.viewMode === "developer") {
    filteredStats = base.filter((s) => ["tasks", "members"].includes(s.key));
  }
  if (props.viewMode === "tester") {
    filteredStats = base.filter((s) =>
      ["requirements", "tasks"].includes(s.key),
    );
  }
  if (props.viewMode === "product") {
    filteredStats = base.filter((s) =>
      ["requirements", "tasks", "members"].includes(s.key),
    );
  }

  if (props.viewMode !== "developer") {
    filteredStats = [
      ...filteredStats,
      {
        key: "completion",
        title: "完成率",
        value: `${completionRate.value}%`,
        icon: Check,
        color: "#10b981",
      },
    ];
  }

  return filteredStats;
});

const handleStatClick = (key: string) => {
  if (key === "requirements") {
    emit("requirementsClick");
  }
};
</script>

<template>
  <el-row :gutter="16" style="margin-bottom: 16px">
    <el-col :xs="12" :sm="12" :md="6" v-for="stat in stats" :key="stat.title">
      <StatCard
        :key="stat.key"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :color="stat.color"
        :clickable="stat.clickable"
        @click="handleStatClick(stat.key)"
      />
    </el-col>
  </el-row>
</template>

<style scoped>
.stats-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 0;
}

@media (max-width: 768px) {
  .stats-card-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
