<script setup lang="ts">
import { ref, watch } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Globe, Server } from 'lucide-vue-next';

interface TechStackInput {
  frontend: string[];
  backend: string[];
}

const props = defineProps<{
  modelValue?: TechStackInput;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: TechStackInput];
}>();

const frontendTags = ref<string[]>([...props.modelValue?.frontend || []]);
const backendTags = ref<string[]>([...props.modelValue?.backend || []]);

const newFrontendTag = ref('');
const newBackendTag = ref('');

watch(() => props.modelValue, (val) => {
  if (val) {
    frontendTags.value = [...val.frontend];
    backendTags.value = [...val.backend];
  }
}, { deep: true, immediate: true });

function emitUpdate() {
  emit('update:modelValue', {
    frontend: [...frontendTags.value],
    backend: [...backendTags.value],
  });
}

function addFrontendTag() {
  const tag = newFrontendTag.value.trim();
  if (tag && !frontendTags.value.includes(tag)) {
    frontendTags.value.push(tag);
    newFrontendTag.value = '';
    emitUpdate();
  }
}

function addBackendTag() {
  const tag = newBackendTag.value.trim();
  if (tag && !backendTags.value.includes(tag)) {
    backendTags.value.push(tag);
    newBackendTag.value = '';
    emitUpdate();
  }
}

function removeFrontendTag(index: number) {
  frontendTags.value.splice(index, 1);
  emitUpdate();
}

function removeBackendTag(index: number) {
  backendTags.value.splice(index, 1);
  emitUpdate();
}

function handleFrontendKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    addFrontendTag();
  }
}

function handleBackendKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    addBackendTag();
  }
}
</script>

<template>
  <div class="grid grid-cols-2 gap-6">
    <Card class="border-primary/20">
      <CardHeader class="pb-3">
        <CardTitle class="text-base flex items-center gap-2">
          <Globe class="w-4 h-4 text-primary" />
          前端技术
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex gap-2">
          <Input
            v-model="newFrontendTag"
            placeholder="输入后按回车添加"
            @keydown="handleFrontendKeydown"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            @click="addFrontendTag"
          >
            <Plus class="w-4 h-4" />
          </Button>
        </div>
        <div class="flex flex-wrap gap-2 min-h-[32px]">
          <Badge
            v-for="(tag, index) in frontendTags"
            :key="tag"
            variant="secondary"
            class="pr-1.5"
          >
            {{ tag }}
            <button
              type="button"
              class="ml-1 hover:text-destructive"
              @click="removeFrontendTag(index)"
            >
              <X class="w-3 h-3" />
            </button>
          </Badge>
          <span v-if="frontendTags.length === 0" class="text-sm text-muted-foreground">
            暂无技术
          </span>
        </div>
      </CardContent>
    </Card>

    <Card class="border-primary/20">
      <CardHeader class="pb-3">
        <CardTitle class="text-base flex items-center gap-2">
          <Server class="w-4 h-4 text-primary" />
          后端技术
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex gap-2">
          <Input
            v-model="newBackendTag"
            placeholder="输入后按回车添加"
            @keydown="handleBackendKeydown"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            @click="addBackendTag"
          >
            <Plus class="w-4 h-4" />
          </Button>
        </div>
        <div class="flex flex-wrap gap-2 min-h-[32px]">
          <Badge
            v-for="(tag, index) in backendTags"
            :key="tag"
            variant="secondary"
            class="pr-1.5"
          >
            {{ tag }}
            <button
              type="button"
              class="ml-1 hover:text-destructive"
              @click="removeBackendTag(index)"
            >
              <X class="w-3 h-3" />
            </button>
          </Badge>
          <span v-if="backendTags.length === 0" class="text-sm text-muted-foreground">
            暂无技术
          </span>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
