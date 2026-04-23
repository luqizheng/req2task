<script setup lang="ts">
import { computed, type Component } from 'vue';
import { Top, Bottom } from '@element-plus/icons-vue';

type LayoutMode = 'horizontal' | 'vertical';

interface Props {
  title: string;
  value: number | string;
  icon: Component;
  color: string;
  trend?: string;
  trendUp?: boolean;
  layout?: LayoutMode;
  clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  trend: undefined,
  trendUp: true,
  layout: 'horizontal',
  clickable: false,
});

const emit = defineEmits<{
  click: [];
}>();

const isVertical = computed(() => props.layout === 'vertical');
</script>

<template>
  <el-card
    class="stat-card"
    :class="{ 'is-clickable': clickable }"
    shadow="hover"
    @click="clickable && emit('click')"
  >
    <div :class="['stat-content', { vertical: isVertical }]">
      <div class="stat-icon" :style="{ backgroundColor: color + '15', color: color }">
        <el-icon :size="24">
          <component :is="icon" />
        </el-icon>
      </div>
      <div :class="['stat-info', { 'text-center': isVertical }]">
        <p v-if="!isVertical" class="stat-title">{{ title }}</p>
        <div v-if="!isVertical" class="stat-value-row">
          <span class="stat-value">{{ value }}</span>
          <span v-if="trend" class="stat-trend" :class="{ up: trendUp, down: !trendUp }">
            <el-icon><Top v-if="trendUp" /><Bottom v-else /></el-icon>
            {{ trend }}
          </span>
        </div>
        <template v-else>
          <span class="stat-value-lg">{{ value }}</span>
          <span class="stat-label">{{ title }}</span>
        </template>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.stat-card {
  height: 100%;
}

.stat-card.is-clickable {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card.is-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card :deep(.el-card__body) {
  padding: 16px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-content.vertical {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content.vertical .stat-icon {
  width: 40px;
  height: 40px;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-info.text-center {
  text-align: center;
}

.stat-title {
  margin: 0 0 4px;
  font-size: 13px;
  color: #64748b;
}

.stat-value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  font-variant-numeric: tabular-nums;
}

.stat-value-lg {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
}

.stat-trend.up {
  color: #10b981;
}

.stat-trend.down {
  color: #ef4444;
}

@media (max-width: 768px) {
  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-content {
    gap: 12px;
  }

  .stat-content.vertical .stat-icon {
    width: 36px;
    height: 36px;
  }

  .stat-value-lg {
    font-size: 22px;
  }
}
</style>
