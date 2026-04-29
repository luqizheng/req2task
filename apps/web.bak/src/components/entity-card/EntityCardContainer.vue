<script setup lang="ts">
import { computed, useSlots } from 'vue';

export type CardLayout = 'grid' | 'list' | 'masonry';

const props = withDefaults(defineProps<{
  title?: string;
  count?: number;
  layout?: CardLayout;
  columns?: number;
  emptyText?: string;
  emptyDescription?: string;
  loading?: boolean;
  bordered?: boolean;
}>(), {
  layout: 'grid',
  columns: 3,
  emptyText: '暂无数据',
  emptyDescription: '',
  loading: false,
  bordered: true,
});

const slots = useSlots();

const gridStyle = computed((): Record<string, string> => {
  if (props.layout === 'list') {
    return {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    };
  }
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
    gap: '16px',
  };
});

const hasDefaultSlot = computed(() => !!slots.default);
</script>

<template>
  <div class="entity-card-container">
    <div v-if="title || count !== undefined" class="container-header">
      <div class="header-left">
        <h3 v-if="title" class="container-title">{{ title }}</h3>
      </div>
      <div class="header-right">
        <slot name="header-actions" />
        <span v-if="count !== undefined" class="count-badge">{{ count }}</span>
      </div>
    </div>

    <div class="container-body">
      <div v-if="slots.toolbar" class="toolbar">
        <slot name="toolbar" />
      </div>

      <div
        v-if="hasDefaultSlot"
        class="card-grid"
        :class="[`layout-${layout}`, { bordered }]"
        :style="gridStyle"
      >
        <slot />
      </div>

      <slot name="append" />

      <div
        v-if="!hasDefaultSlot && !loading"
        class="empty-state"
      >
        <slot name="empty">
          <p class="empty-text">{{ emptyText }}</p>
          <p v-if="emptyDescription" class="empty-description">{{ emptyDescription }}</p>
        </slot>
      </div>
    </div>

    <div v-if="slots.footer" class="container-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.entity-card-container {
  display: flex;
  flex-direction: column;
}

.container-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.container-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.count-badge {
  padding: 2px 10px;
  background: #409eff;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.container-body {
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.card-grid {
  min-height: 100px;
}

.card-grid.bordered {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.layout-grid {
  align-items: start;
}

.layout-list {
  width: 100%;
}

.layout-masonry {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.layout-masonry > :deep(*) {
  width: calc(33.333% - 16px);
}

@media (max-width: 1200px) {
  .layout-masonry > :deep(*) {
    width: calc(50% - 16px);
  }
}

@media (max-width: 768px) {
  .layout-masonry > :deep(*),
  [style*="grid-template-columns"] > :deep(*) {
    width: 100% !important;
  }
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.empty-text {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.empty-description {
  margin: 8px 0 0;
  font-size: 12px;
  color: #c0c4cc;
}

.container-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
