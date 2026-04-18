<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';

defineProps<{
  visible: boolean;
  formRef: FormInstance | undefined;
  form: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  rules: FormRules;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'submit'): void;
}>();

const handleClose = () => {
  emit('update:visible', false);
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="修改密码"
    width="400px"
    @update:model-value="emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="当前密码" prop="oldPassword">
        <el-input v-model="form.oldPassword" type="password" show-password />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="form.newPassword" type="password" show-password />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="emit('submit')">确定</el-button>
    </template>
  </el-dialog>
</template>
