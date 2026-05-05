<script setup lang="ts">
import WizardField from './WizardField.vue';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { WizardStepDto, WizardFieldDto } from '@req2task/dto';

const props = defineProps<{
  step: WizardStepDto;
  isActive: boolean;
  formData: Record<string, unknown>;
  errors?: Record<string, string>;
}>();

const emit = defineEmits<{
  'update:field': [key: string, value: unknown];
  'requestSuggestion': [field: WizardFieldDto];
}>();

const getFieldValue = (key: string): unknown => {
  const keys = key.split('.');
  let value: unknown = props.formData;
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return value;
};

const handleFieldUpdate = (key: string, value: unknown) => {
  emit('update:field', key, value);
};

const handleSuggestionRequest = (field: WizardFieldDto) => {
  emit('requestSuggestion', field);
};
</script>

<template>
  <Card
    v-show="isActive"
    class="transition-all duration-300"
    :class="{
      'border-primary/50 shadow-md': isActive,
      'opacity-60': !isActive,
    }"
  >
    <CardHeader class="pb-4">
      <div class="flex items-start justify-between">
        <div>
          <CardTitle class="text-xl">{{ step.title }}</CardTitle>
          <CardDescription class="mt-1.5">{{ step.description }}</CardDescription>
        </div>
        <div
          v-if="step.aiSuggestion"
          class="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
        >
          AI 辅助
        </div>
      </div>
    </CardHeader>
    <CardContent class="space-y-6">
      <div
        v-for="field in step.fields"
        :key="field.key"
        class="space-y-4"
      >
        <WizardField
          :field="field"
          :model-value="getFieldValue(field.key)"
          :error="errors?.[field.key]"
          @update:model-value="handleFieldUpdate(field.key, $event)"
          @request-suggestion="handleSuggestionRequest"
        />
      </div>

      <div
        v-if="step.fields.length === 0"
        class="text-center py-8 text-muted-foreground"
      >
        <p>此步骤无需额外配置</p>
      </div>
    </CardContent>
  </Card>
</template>
