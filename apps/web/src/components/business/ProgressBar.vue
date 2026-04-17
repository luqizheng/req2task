<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  percentage: number;
  strokeWidth?: number;
  color?: string | string[];
  trackColor?: string;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  format?: (percentage: number) => string;
  striped?: boolean;
  stripedFlow?: boolean;
  status?: 'success' | 'warning' | 'exception';
}>();

const displayPercentage = computed(() => Math.min(100, Math.max(0, props.percentage)));

const displayText = computed(() => {
  if (props.format) {
    return props.format(displayPercentage.value);
  }
  return `${displayPercentage.value}%`;
});

const strokeWidthMap = {
  small: 6,
  medium: 8,
  large: 10
};

const computedStrokeWidth = computed(() => {
  if (props.strokeWidth) return props.strokeWidth;
  return strokeWidthMap[props.size || 'medium'];
});
</script>

<template>
  <div class="progress-bar" :class="[`progress-${size || 'medium'}`]">
    <div class="progress-track" :style="{ height: `${computedStrokeWidth}px`, background: trackColor }">
      <div
        class="progress-fill"
        :class="{ 'is-striped': striped, 'is-striped-flow': stripedFlow }"
        :style="{
          width: `${displayPercentage}%`,
          height: `${computedStrokeWidth}px`,
          background: typeof color === 'string' ? color : undefined
        }"
      >
        <template v-if="typeof color === 'object'">
          <span
            v-for="(c, i) in color"
            :key="i"
            class="progress-segment"
            :style="{
              background: c,
              width: `${100 / color.length}%`
            }"
          />
        </template>
      </div>
    </div>
    <span v-if="showText !== false" class="progress-text">{{ displayText }}</span>
  </div>
</template>

<style scoped>
.progress-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.progress-track {
  flex: 1;
  background: #e2e8f0;
  border-radius: 100px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  border-radius: 100px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-segment {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
}

.progress-text {
  font-size: 14px;
  color: #64748b;
  min-width: 40px;
  text-align: right;
}

.is-striped {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 16px 16px;
}

.is-striped-flow {
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  0% {
    background-position: 16px 0;
  }
  100% {
    background-position: 0 0;
  }
}
</style>
