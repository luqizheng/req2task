<script setup lang="ts">
import { ref, watch } from 'vue';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Priority } from '@req2task/dto';

const props = defineProps<{
  open: boolean;
  projectId: string;
  suggestedTitle?: string | null;
  suggestedDescription?: string | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirm: [data: {
    title: string;
    description: string;
    priority: Priority;
    storyPoints: number;
  }];
}>();

const title = ref('');
const description = ref('');
const priority = ref<Priority>(Priority.MEDIUM);
const storyPoints = ref(1);
const titleError = ref<string>();

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      title.value = props.suggestedTitle || '';
      description.value = props.suggestedDescription || '';
      priority.value = Priority.MEDIUM;
      storyPoints.value = 1;
    }
  },
  { immediate: true }
);

watch(
  () => props.suggestedTitle,
  (val) => {
    if (val && !title.value) {
      title.value = val;
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
  if (!title.value.trim()) {
    titleError.value = '请输入需求标题';
    return;
  }
  titleError.value = undefined;

  emit('confirm', {
    title: title.value.trim(),
    description: description.value?.trim() || '',
    priority: priority.value,
    storyPoints: storyPoints.value,
  });
  handleClose();
}

const priorityOptions = [
  { value: Priority.CRITICAL, label: '关键' },
  { value: Priority.HIGH, label: '高' },
  { value: Priority.MEDIUM, label: '中' },
  { value: Priority.LOW, label: '低' },
];

const storyPointOptions = [1, 2, 3, 5, 8, 13, 21];
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>创建新需求</DialogTitle>
        <DialogDescription>
          创建一个新的需求记录，可以设置优先级和故事点。
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <Field :data-invalid="!!titleError">
          <FieldLabel for="requirement-title">需求标题 *</FieldLabel>
          <Input
            id="requirement-title"
            v-model="title"
            placeholder="请输入需求标题"
            :aria-invalid="!!titleError"
          />
          <FieldError v-if="titleError" :errors="[titleError]" />
        </Field>

        <Field>
          <FieldLabel for="requirement-description">需求描述</FieldLabel>
          <Textarea
            id="requirement-description"
            v-model="description"
            placeholder="请输入需求描述（可选）"
            rows="3"
          />
        </Field>

        <div class="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel for="requirement-priority">优先级</FieldLabel>
            <Select v-model="priority">
              <SelectTrigger id="requirement-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in priorityOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel for="requirement-story-points">故事点</FieldLabel>
            <Select v-model="storyPoints">
              <SelectTrigger id="requirement-story-points">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="sp in storyPointOptions"
                  :key="sp"
                  :value="sp"
                >
                  {{ sp }} SP
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">取消</Button>
        <Button :disabled="!title || !title.trim()" @click="handleConfirm">
          创建需求
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
