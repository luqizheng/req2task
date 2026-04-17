<script setup lang="ts">
defineProps<{
  image?: string;
  description?: string;
  imageSize?: number;
}>();

const emit = defineEmits<{
  action: [];
}>();
</script>

<template>
  <div class="app-empty">
    <el-empty
      :image="image"
      :description="description || '暂无数据'"
      :image-size="imageSize"
    >
      <template #default v-if="$slots.action || $slots.extra">
        <slot name="action">
          <el-button v-if="$slots.extra || false" type="primary" @click="emit('action')">
            <slot name="extra" />
          </el-button>
        </slot>
      </template>
    </el-empty>
  </div>
</template>

<style scoped>
.app-empty {
  padding: 40px 0;
}
</style>
