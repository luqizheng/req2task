<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue';

defineProps<{
  criteria: string[];
  isEditing: boolean;
  isRegenerating: boolean;
}>();

const emit = defineEmits<{
  'add': [];
  'remove': [index: number];
  'update': [index: number, value: string];
  'regenerate': [];
}>();

const handleInput = (index: number, e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('update', index, target.value);
};
</script>

<template>
  <div class="criteria-section">
    <div class="section-header">
      <h4 class="section-title">验收条件</h4>
      <el-button
        v-if="isEditing"
        size="small"
        type="primary"
        @click="emit('add')"
      >
        添加
      </el-button>
      <el-button
        v-else
        size="small"
        type="warning"
        :icon="Refresh"
        @click="emit('regenerate')"
        :loading="isRegenerating"
      >
        重新生成
      </el-button>
    </div>

    <el-checkbox-group v-if="isEditing">
      <div
        v-for="(_, index) in criteria"
        :key="index"
        class="criteria-item"
      >
        <el-input
          :model-value="criteria[index]"
          placeholder="验收条件..."
          @input="handleInput(index, $event)"
        />
        <el-button
          type="danger"
          text
          @click="emit('remove', index)"
        >
          删除
        </el-button>
      </div>
    </el-checkbox-group>

    <el-space
      v-else
      direction="vertical"
      style="width: 100%"
    >
      <el-check-tag
        v-for="(item, index) in criteria"
        :key="index"
        type="success"
        style="width: 100%; text-align: left"
      >
        {{ item }}
      </el-check-tag>
    </el-space>

    <el-empty
      v-if="criteria.length === 0"
      description="暂无验收条件"
      :image-size="60"
    />
  </div>
</template>

<style scoped>
.criteria-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.criteria-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.criteria-item .el-input {
  flex: 1;
}
</style>
