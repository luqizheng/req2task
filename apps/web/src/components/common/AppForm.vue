<script setup lang="ts">
import { ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

defineProps<{
  model: Record<string, any>;
  rules?: FormRules;
  labelWidth?: string | number;
  labelPosition?: 'left' | 'right' | 'top';
  disabled?: boolean;
  inline?: boolean;
  size?: 'large' | 'default' | 'small';
}>();

const emit = defineEmits<{
  validate: [valid: boolean];
  validateField: [prop: string, callback: (valid: boolean) => void];
  resetField: [];
  clearValidate: [];
}>();

const formRef = ref<FormInstance>();

const validate = () => {
  return formRef.value?.validate();
};

const validateField = (prop: string) => {
  return formRef.value?.validateField(prop);
};

const resetFields = () => {
  formRef.value?.resetFields();
};

const clearValidate = () => {
  formRef.value?.clearValidate();
};

defineExpose({
  validate,
  validateField,
  resetFields,
  clearValidate
});
</script>

<template>
  <el-form
    ref="formRef"
    :model="model"
    :rules="rules"
    :label-width="labelWidth"
    :label-position="labelPosition || 'right'"
    :disabled="disabled"
    :inline="inline"
    :size="size"
    class="app-form"
    @validate="emit('validate', $event)"
    @validate-field="emit('validateField', $event.prop, $event.isValid)"
  >
    <slot />
  </el-form>
</template>

<style scoped>
.app-form {
  width: 100%;
}
</style>
