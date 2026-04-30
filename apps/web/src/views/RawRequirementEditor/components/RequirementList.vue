<template>
  <div>
    <RequirementCard
      :requirement="equipment"
      :index="index"
      v-for="(equipment, index) in requirements"
      :key="equipment.id"
    />
  </div>
</template>
<script lang="ts" setup>
import { computed } from "vue";
import { useRawRequirementCreateStore } from "../store";
import RequirementCard from "./RequirementCard.vue";
interface Props {
  projectId: string;
  store: ReturnType<typeof useRawRequirementCreateStore>;
}
const requirements = computed(() => props.store.requirements);
const props = defineProps<Props>();
</script>
