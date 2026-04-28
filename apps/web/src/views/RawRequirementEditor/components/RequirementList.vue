<template>
  <div>
    <RequirementCard
      :equipment="equipment"
      :index="index"
      v-for="(equipment, index) in props.store.requirements"
      :key="equipment.id"
    />
  </div>
</template>
<script lang="ts" setup>
import { useRawRequirementCreateStore } from "../store";

interface Props {
  projectId: string;
  store: ReturnType<typeof useRawRequirementCreateStore>;
}

const props = defineProps<Props>();
</script>
