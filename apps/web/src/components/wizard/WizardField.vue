<script setup lang="ts">
import { computed } from 'vue';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Info } from 'lucide-vue-next';
import type { WizardFieldDto } from '@req2task/dto';

const props = defineProps<{
  field: WizardFieldDto;
  modelValue: unknown;
  error?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: unknown];
  'requestSuggestion': [field: WizardFieldDto];
}>();

const fieldValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const handleSuggestionRequest = () => {
  if (props.field.aiSuggestion || props.field.aiGenerated) {
    emit('requestSuggestion', props.field);
  }
};

const isSingleSelect = computed(() => props.field.type === 'select');
const isMultiSelect = computed(() => props.field.type === 'multiselect');
const isText = computed(() => props.field.type === 'text');
const isNumber = computed(() => props.field.type === 'number');
const isBoolean = computed(() => props.field.type === 'boolean');
const showAiButton = computed(() => props.field.aiSuggestion || props.field.aiGenerated);
</script>

<template>
  <Field :data-invalid="!!error">
    <div class="flex items-center justify-between mb-1.5">
      <div class="flex items-center gap-2">
        <FieldLabel class="text-base">
          {{ field.label }}
          <span v-if="field.required" class="text-destructive ml-0.5">*</span>
        </FieldLabel>
        <button
          v-if="showAiButton"
          type="button"
          class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          title="AI 智能推荐"
          @click="handleSuggestionRequest"
        >
          <Sparkles class="h-3 w-3" />
          AI
        </button>
      </div>
      <span
        v-if="field.placeholder"
        class="text-xs text-muted-foreground"
      >
        <Info class="h-3 w-3 inline mr-0.5" />
        {{ field.placeholder }}
      </span>
    </div>

    <!-- Text Input -->
    <template v-if="isText">
      <Textarea
        v-if="field.key.includes('description') || field.key.includes('description')"
        :model-value="String(fieldValue ?? '')"
        class="transition-all duration-200 focus:ring-2 focus:ring-primary/20 resize-none"
        rows="3"
        @update:model-value="fieldValue = $event"
      />
      <Input
        v-else
        :model-value="String(fieldValue ?? '')"
        :placeholder="field.placeholder"
        class="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
        @update:model-value="fieldValue = $event"
      />
    </template>

    <!-- Number Input -->
    <template v-else-if="isNumber">
      <Input
        type="number"
        :model-value="fieldValue as number"
        :min="field.validation?.min"
        :max="field.validation?.max"
        :placeholder="field.placeholder"
        class="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
        @update:model-value="fieldValue = Number($event)"
      />
      <p
        v-if="field.validation?.message"
        class="text-xs text-muted-foreground mt-1"
      >
        {{ field.validation.message }}
      </p>
    </template>

    <!-- Select -->
    <template v-else-if="isSingleSelect">
      <Select
        :model-value="fieldValue as string"
        @update:model-value="fieldValue = $event"
      >
        <SelectTrigger class="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
          <SelectValue :placeholder="field.placeholder || '请选择'" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in field.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </template>

    <!-- Multi Select (Checkbox Group) -->
    <template v-else-if="isMultiSelect">
      <div class="flex flex-wrap gap-3">
        <div
          v-for="option in field.options"
          :key="option.value"
          class="flex items-center space-x-2"
        >
          <Checkbox
            :id="`${field.key}-${option.value}`"
            :checked="(fieldValue as string[] | undefined)?.includes(option.value)"
            @update:checked="(checked: boolean) => {
              const arr = [...((fieldValue as string[]) || [])];
              if (checked) arr.push(option.value);
              else {
                const idx = arr.indexOf(option.value);
                if (idx > -1) arr.splice(idx, 1);
              }
              fieldValue = arr;
            }"
          />
          <label
            :for="`${field.key}-${option.value}`"
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {{ option.label }}
          </label>
        </div>
      </div>
    </template>

    <!-- Boolean Switch -->
    <template v-else-if="isBoolean">
      <div class="flex items-center gap-2">
        <Switch
          :model-value="Boolean(fieldValue)"
          @update:model-value="fieldValue = $event"
        />
        <span class="text-sm text-muted-foreground">
          {{ fieldValue ? '是' : '否' }}
        </span>
      </div>
    </template>

    <FieldError v-if="error">{{ error }}</FieldError>
  </Field>
</template>
