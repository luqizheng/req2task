<template>
  <div class="app-card" :class="cardClass" @click="handleClick">
    <div v-if="$slots.header || title" class="card-header">
      <div class="header-left">
        <div v-if="showStatusDot" class="status-dot" :class="dotClass">
          <slot name="icon">
            <CheckIcon v-if="status === 'success'" class="status-icon" />
            <MinusIcon v-else-if="status === 'warning'" class="status-icon" />
            <QuestionIcon
              v-else-if="status === 'selected'"
              class="status-icon"
            />
            <ChevronDownIcon v-else class="status-icon" />
          </slot>
        </div>
        <span v-if="title" class="card-label" :class="labelClass">{{
          title
        }}</span>
      </div>
      <div v-if="$slots.tag || statusText" class="status-tag" :class="tagClass">
        <slot name="tag">{{ statusText }}</slot>
      </div>
    </div>

    <div v-if="title && dividerLine" class="divider-line"></div>

    <div v-if="$slots.default" class="card-content">
      <slot></slot>
    </div>

    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  CheckIcon,
  MinusIcon,
  QuestionIcon,
  ChevronDownIcon,
} from "@/components/icons";

type CardStatus = "default" | "success" | "warning" | "selected";

interface Props {
  status?: CardStatus;
  title?: string;
  label?: string;
  statusText?: string;
  showStatusDot?: boolean;
  clickable?: boolean;
  dividerLine?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  status: "default",
  showStatusDot: false,
  clickable: true,
  dividerLine: false,
});

const emit = defineEmits<{
  click: [];
}>();

const cardClass = computed(() => {
  const classes: string[] = [];
  if (props.status === "selected") classes.push("is-selected");
  if (props.status === "success") classes.push("is-success");
  if (props.status === "warning") classes.push("is-warning");
  if (!props.clickable) classes.push("non-clickable");
  return classes;
});

const dotClass = computed(() => {
  const classes: string[] = [];
  if (props.status === "success") classes.push("dot-success");
  if (props.status === "warning") classes.push("dot-warning");
  if (props.status === "selected") classes.push("dot-selected");
  return classes;
});

const labelClass = computed(() => {
  const classes: string[] = [];
  if (props.status === "success") classes.push("label-success");
  if (props.status === "warning") classes.push("label-warning");
  if (props.status === "selected") classes.push("label-selected");
  return classes;
});

const tagClass = computed(() => {
  const classes: string[] = [];
  if (props.status === "success") classes.push("tag-success");
  if (props.status === "warning") classes.push("tag-warning");
  if (props.status === "selected") classes.push("tag-selected");
  return classes;
});

const handleClick = () => {
  if (props.clickable) {
    emit("click");
  }
};
</script>

<style scoped>
.app-card {
  padding: 14px 16px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e4e4e4;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.app-card:hover {
  border-color: #cbd5e1;
}

.app-card.non-clickable {
  cursor: default;
}

.app-card.is-selected {
  background: #eff6ff;
  border: 1.5px solid #2563eb;
}

.app-card.is-success {
  background: #ffffff;
  border-color: #e4e4e4;
}

.app-card.is-warning {
  background: #ffffff;
  border-color: #e4e4e4;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-icon {
  width: 11px;
  height: 11px;
}

.status-dot.dot-success {
  background: #dcfce7;
  color: #16a34a;
}

.status-dot.dot-warning {
  background: #fef9c3;
  color: #ca8a04;
}

.status-dot.dot-selected {
  background: #dbeafe;
  color: #2563eb;
}

.card-label {
  font-size: 12px;
  font-weight: 600;
}

.card-label.label-success {
  color: #16a34a;
}

.card-label.label-warning {
  color: #ca8a04;
}

.card-label.label-selected {
  color: #2563eb;
}

.divider-line {
  width: cal(100%-200px);
  height: 1px;
  background: #e4e4e4;
  min-width: 20px;
  margin: 0
}

.status-tag {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.status-tag.tag-success {
  background: #f4f4f5;
  color: #71717a;
}

.status-tag.tag-warning {
  background: #fef9c3;
  color: #ca8a04;
}

.status-tag.tag-selected {
  background: #dbeafe;
  color: #2563eb;
}

.card-content {
  font-size: 13px;
  font-weight: 500;
  color: #18181b;
  line-height: 150%;
}

.card-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
