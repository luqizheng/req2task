<script setup lang="ts">
import { computed } from 'vue';

export interface Member {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}

const props = defineProps<{
  modelValue?: string | string[];
  members: Member[];
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  filterable?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [val: string | string[]];
  change: [val: string | string[]];
}>();

const selectedValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val as string | string[])
});

const handleChange = (val: string | string[]) => {
  emit('change', val);
};

const getMemberLabel = (member: Member) => {
  return member.name + (member.email ? ` (${member.email})` : '');
};

const filterMethod = (query: string, item: Member) => {
  const label = getMemberLabel(item);
  return label.toLowerCase().includes(query.toLowerCase());
};
</script>

<template>
  <el-select
    v-model="selectedValue"
    :multiple="multiple"
    :placeholder="placeholder || '请选择成员'"
    :disabled="disabled"
    :clearable="clearable ?? true"
    :filterable="filterable ?? true"
    :filter-method="filterMethod"
    class="member-select"
    @change="handleChange"
  >
    <el-option
      v-for="member in members"
      :key="member.id"
      :label="getMemberLabel(member)"
      :value="member.id"
    >
      <div class="member-option">
        <el-avatar :size="24" :src="member.avatar">
          {{ member.name?.charAt(0) }}
        </el-avatar>
        <span class="member-name">{{ member.name }}</span>
        <span v-if="member.email" class="member-email">{{ member.email }}</span>
      </div>
    </el-option>
  </el-select>
</template>

<style scoped>
.member-select {
  width: 100%;
}

.member-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.member-name {
  font-weight: 500;
  color: #1e293b;
}

.member-email {
  font-size: 12px;
  color: #94a3b8;
}
</style>
