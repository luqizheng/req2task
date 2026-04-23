<script setup lang="ts">
defineProps<{
  modelValue: string;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'clear': [];
  'generate': [];
}>();

const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <el-card class="requirement-input-card">
    <template #header>
      <div class="card-header">
        <span class="card-title">原始需求输入</span>
        <el-button size="small" @click="emit('clear')">清空</el-button>
      </div>
    </template>

    <el-input
      :model-value="modelValue"
      type="textarea"
      :rows="12"
      placeholder="请输入原始需求描述..."
      :disabled="isLoading"
      @input="handleInput"
    />

    <div class="input-actions">
      <el-button
        type="primary"
        :loading="isLoading"
        @click="emit('generate')"
        size="large"
      >
        AI 生成
      </el-button>
    </div>
  </el-card>
</template>

<style scoped>
.requirement-input-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.input-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
