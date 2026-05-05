<script setup lang="ts">
import { watch, ref } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Field,
  FieldLabel,
  FieldError,
} from '@/components/ui/field';
const props = defineProps<{
  open: boolean;
  suggestedName?: string | null;
  suggestedDescription?: string | null;
  projectId?: string;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirm: [name: string, description: string];
}>();

const name = defineModel<string>('name', { default: '' });
const description = defineModel<string>('description', { default: '' });
const nameError = ref<string>();
const descriptionError = ref<string>();

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      name.value = props.suggestedName || '';
      description.value = props.suggestedDescription || '';
    }
  },
  { immediate: true }
);

watch(
  () => props.suggestedName,
  (val) => {
    if (val && !name.value) {
      name.value = val;
    }
  }
);

watch(
  () => props.suggestedDescription,
  (val) => {
    if (val && !description.value) {
      description.value = val;
    }
  }
);

function handleClose() {
  emit('update:open', false);
}

function handleConfirm() {
  if (name.value && name.value.trim()) {
    emit('confirm', name.value.trim(), description.value?.trim() || '');
    handleClose();
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>创建新模块</DialogTitle>
        <DialogDescription>
          根据需求内容创建新的功能模块。模块将自动关联到选中的需求。
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <Field :data-invalid="!!nameError">
          <FieldLabel for="module-name">模块名称 *</FieldLabel>
          <Input
            id="module-name"
            v-model="name"
            placeholder="请输入模块名称，如：用户权限管理"
            :aria-invalid="!!nameError"
          />
          <FieldError v-if="nameError" :errors="[nameError]" />
        </Field>

        <Field :data-invalid="!!descriptionError">
          <FieldLabel for="module-description">模块描述</FieldLabel>
          <Textarea
            id="module-description"
            v-model="description"
            placeholder="请输入模块描述（可选）"
            rows="3"
            :aria-invalid="!!descriptionError"
          />
          <FieldError v-if="descriptionError" :errors="[descriptionError]" />
        </Field>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">取消</Button>
        <Button :disabled="!name || !name.trim()" @click="handleConfirm">
          创建模块
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
