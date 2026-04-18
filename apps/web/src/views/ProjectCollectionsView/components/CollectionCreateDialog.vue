<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import type { CollectionType } from '@/api/requirementCollection';

const props = defineProps<{
  modelValue: boolean;
  initialData: {
    title: string;
    collectionType: CollectionType;
    meetingMinutes: string;
  };
  collectionTypeOptions: { value: CollectionType; label: string }[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [data: { title: string; collectionType: CollectionType; meetingMinutes: string }];
}>();

const formRef = ref<FormInstance>();
const formData = reactive({
  title: '',
  collectionType: 'meeting' as CollectionType,
  meetingMinutes: '',
});

const rules: FormRules = {
  title: [{ required: true, message: '请输入收集标题', trigger: 'blur' }],
  collectionType: [{ required: true, message: '请选择收集类型', trigger: 'change' }],
};

watch(() => props.modelValue, (visible) => {
  if (visible) {
    formData.title = props.initialData.title;
    formData.collectionType = props.initialData.collectionType;
    formData.meetingMinutes = props.initialData.meetingMinutes;
    formRef.value?.clearValidate();
  }
});

const handleConfirm = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  emit('confirm', { ...formData });
  emit('update:modelValue', false);
};
</script>

<template>
  <el-dialog
    title="新建需求收集"
    width="500px"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="收集标题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入收集标题" />
      </el-form-item>
      <el-form-item label="收集类型" prop="collectionType">
        <el-select v-model="formData.collectionType" style="width: 100%">
          <el-option
            v-for="item in collectionTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="会议纪要">
        <el-input
          v-model="formData.meetingMinutes"
          type="textarea"
          :rows="4"
          placeholder="可选，填写会议纪要或访谈记录"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="handleConfirm">创建</el-button>
    </template>
  </el-dialog>
</template>
