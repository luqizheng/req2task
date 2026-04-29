<script setup lang="ts">
import { computed } from 'vue';
import type { BurndownPoint } from '@/api/projects';

const props = defineProps<{
  data: BurndownPoint[];
}>();

const maxValue = computed(() => {
  if (!props.data.length) return 100;
  const max = Math.max(
    ...props.data.map(d => Math.max(d.planned, d.actual))
  );
  return max > 0 ? max * 1.1 : 100;
});

const chartHeight = 200;
const padding = 40;

const getY = (value: number) => {
  return chartHeight - (value / maxValue.value) * (chartHeight - padding);
};

const plannedPath = computed(() => {
  if (!props.data.length) return '';
  const width = 100;
  const step = width / (props.data.length - 1);
  return props.data.map((d, i) => {
    const x = i * step;
    const y = getY(d.planned);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
});

const actualPath = computed(() => {
  if (!props.data.length) return '';
  const width = 100;
  const step = width / (props.data.length - 1);
  return props.data.map((d, i) => {
    const x = i * step;
    const y = getY(d.actual);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
});

const gridLines = computed(() => {
  const lines = [];
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const value = Math.round(maxValue.value * (1 - i / steps));
    const y = (i / steps) * (chartHeight - padding);
    lines.push({ value, y });
  }
  return lines;
});

const labels = computed(() => {
  return props.data.map((d, i) => {
    const width = 100;
    const step = width / (props.data.length - 1);
    return {
      x: i * step,
      label: d.date.slice(5),
      index: i
    };
  });
});
</script>

<template>
  <div class="burndown-chart">
    <div class="chart-header">
      <span class="chart-title">燃尽图</span>
      <div class="legend">
        <div class="legend-item">
          <span class="legend-line planned"></span>
          <span>计划</span>
        </div>
        <div class="legend-item">
          <span class="legend-line actual"></span>
          <span>实际</span>
        </div>
      </div>
    </div>

    <div class="chart-container" v-if="data.length">
      <svg viewBox="0 0 100 200" preserveAspectRatio="none" class="chart-svg">
        <g v-for="line in gridLines" :key="line.value" class="grid-line">
          <line
            x1="0"
            :y1="line.y"
            x2="100"
            :y2="line.y"
            stroke="#e2e8f0"
            stroke-width="0.5"
          />
          <text
            x="-2"
            :y="line.y + 1"
            text-anchor="end"
            class="y-label"
          >
            {{ line.value }}
          </text>
        </g>

        <path
          :d="plannedPath"
          fill="none"
          stroke="#94a3b8"
          stroke-width="1"
          stroke-dasharray="2,2"
        />

        <path
          :d="actualPath"
          fill="none"
          stroke="#22c55e"
          stroke-width="1.5"
        />

        <circle
          v-for="(d, i) in data"
          :key="'planned-' + i"
          :cx="i * (100 / (data.length - 1))"
          :cy="getY(d.planned)"
          r="1.5"
          fill="#94a3b8"
        />

        <circle
          v-for="(d, i) in data"
          :key="'actual-' + i"
          :cx="i * (100 / (data.length - 1))"
          :cy="getY(d.actual)"
          r="2"
          fill="#22c55e"
        />
      </svg>

      <div class="x-labels">
        <span
          v-for="label in labels"
          :key="label.index"
          class="x-label"
          :style="{ left: label.x + '%' }"
        >
          {{ label.label }}
        </span>
      </div>
    </div>

    <el-empty v-else description="暂无数据" />
  </div>
</template>

<style scoped>
.burndown-chart {
  width: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.legend-line {
  width: 20px;
  height: 2px;
}

.legend-line.planned {
  background: repeating-linear-gradient(
    to right,
    #94a3b8 0,
    #94a3b8 4px,
    transparent 4px,
    transparent 8px
  );
}

.legend-line.actual {
  background: #22c55e;
}

.chart-container {
  position: relative;
  height: 220px;
}

.chart-svg {
  width: 100%;
  height: 200px;
}

.y-label {
  font-size: 3px;
  fill: #94a3b8;
}

.x-labels {
  position: relative;
  height: 20px;
  margin-top: 4px;
}

.x-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 10px;
  color: #94a3b8;
}
</style>
