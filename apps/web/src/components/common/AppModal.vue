<script setup lang="ts">
import { watch, ref } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  title?: string;
  width?: string;
  fullscreen?: boolean;
  top?: string;
  modal?: boolean;
  appendToBody?: boolean;
  destroyOnClose?: boolean;
  closeOnClickModal?: boolean;
  closeOnPressEscape?: boolean;
  showClose?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [val: boolean];
  open: [];
  close: [];
  opened: [];
  closed: [];
}>();

const visible = ref(props.modelValue);

watch(() => props.modelValue, (val) => {
  visible.value = val;
});

watch(visible, (val) => {
  emit('update:modelValue', val);
  if (val) {
    emit('open');
  } else {
    emit('close');
  }
});

const handleClose = () => {
  visible.value = false;
};
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width || '50%'"
    :fullscreen="fullscreen"
    :top="top || '15vh'"
    :modal="modal ?? true"
    :append-to-body="appendToBody ?? true"
    :destroy-on-close="destroyOnClose ?? false"
    :close-on-click-modal="closeOnClickModal ?? false"
    :close-on-press-escape="closeOnPressEscape ?? true"
    :show-close="showClose ?? true"
    class="app-modal"
    @close="handleClose"
  >
    <slot />
    <template #footer v-if="$slots.footer">
      <slot name="footer" />
    </template>
  </el-dialog>
</template>

<style scoped>
.app-modal :deep(.el-dialog__header) {
  border-bottom: 1px solid #e2e8f0;
  padding: 16px 20px;
  margin-right: 0;
}

.app-modal :deep(.el-dialog__body) {
  padding: 20px;
}

.app-modal :deep(.el-dialog__footer) {
  border-top: 1px solid #e2e8f0;
  padding: 16px 20px;
}
</style>
