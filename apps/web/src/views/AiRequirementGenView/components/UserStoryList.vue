<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue';
import type { UserStory } from '@/api/ai';

defineProps<{
  userStories: UserStory[];
  isEditing: boolean;
  isRegenerating: boolean;
}>();

const emit = defineEmits<{
  'add': [];
  'remove': [index: number];
  'update:role': [index: number, value: string];
  'update:goal': [index: number, value: string];
  'update:benefit': [index: number, value: string];
  'regenerate': [];
}>();
</script>

<template>
  <div class="user-story-section">
    <div class="section-header">
      <h4 class="section-title">用户故事</h4>
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

    <div
      v-for="(story, index) in userStories"
      :key="index"
      class="user-story-item"
    >
      <el-card shadow="hover">
        <template #header>
          <span>用户故事 {{ index + 1 }}</span>
          <el-button
            v-if="isEditing"
            type="danger"
            size="small"
            text
            @click="emit('remove', index)"
          >
            删除
          </el-button>
        </template>
        <el-form label-width="60px" size="small">
          <el-form-item label="角色">
            <el-input
              v-if="isEditing"
              :model-value="story.role"
              placeholder="作为..."
              @input="emit('update:role', index, ($event.target as HTMLInputElement).value)"
            />
            <span v-else>{{ story.role }}</span>
          </el-form-item>
          <el-form-item label="目标">
            <el-input
              v-if="isEditing"
              :model-value="story.goal"
              placeholder="我想要..."
              @input="emit('update:goal', index, ($event.target as HTMLInputElement).value)"
            />
            <span v-else>{{ story.goal }}</span>
          </el-form-item>
          <el-form-item label="收益">
            <el-input
              v-if="isEditing"
              :model-value="story.benefit"
              placeholder="以便..."
              @input="emit('update:benefit', index, ($event.target as HTMLInputElement).value)"
            />
            <span v-else>{{ story.benefit }}</span>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <el-empty
      v-if="userStories.length === 0"
      description="暂无用户故事"
      :image-size="60"
    />
  </div>
</template>

<style scoped>
.user-story-section {
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

.user-story-item {
  margin-bottom: 12px;
}
</style>
