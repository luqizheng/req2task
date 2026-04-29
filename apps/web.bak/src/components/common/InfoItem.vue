<template>
  <div class="info-item-container">
    <div v-for="(item, index) in items" :key="index" class="info-item">
      <p class="info-item-title">{{ item.title }}</p>
      <p class="info-item-content">{{ item.content }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface InfoItem {
  title: string;
  content: string;
}

defineProps<{
  items: InfoItem[];
}>();
</script>

<style scoped>
.info-item-container {
  width: 100%;
  height: auto;
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  background-color: rgba(255, 255, 255, 0);
}

.info-item {
  width: auto;
  height: auto;
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  background-color: rgba(255, 255, 255, 0);
  margin-right: 32px;
}

.info-item-title {
  font-size: 12px;
  font-family: "Inter-Regular";
  font-weight: Regular;
  color: rgba(176, 176, 176, 1);
  width: auto;
  height: auto;
  position: relative;
  flex-shrink: 0;
  white-space: pre;
  flex-grow: 0;
  margin: 0;
}

.info-item-content {
  font-size: 13px;
  font-family: "Inter-Medium";
  font-weight: Medium;
  color: rgba(13, 13, 13, 1);
  width: auto;
  height: auto;
  position: relative;
  flex-shrink: 0;
  white-space: pre;
  flex-grow: 0;
  margin: 0;
}
</style>