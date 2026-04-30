<template>
  <div class="space-y-3">
    <RequirementCard
      v-for="(requirement, index) in requirements"
      :key="requirement.id"
      :requirement="requirement"
      :index="index"
    />

    <!-- Empty State -->
    <div v-if="requirements.length === 0" class="text-center py-8 text-muted-foreground">
      <ListTodo class="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p class="text-sm">暂无需求</p>
      <p class="text-xs">点击"生成需求"按钮创建</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRawRequirementCreateStore } from "../store";
import RequirementCard from "./RequirementCard.vue";
import { ListTodo } from "lucide-vue-next";

interface Props {
  projectId: string;
  store: ReturnType<typeof useRawRequirementCreateStore>;
}

const props = defineProps<Props>();
const requirements = computed(() => props.store.requirements);
</script>
