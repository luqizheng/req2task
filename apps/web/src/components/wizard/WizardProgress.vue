<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import type { WizardStepDto } from '@req2task/dto';

const props = defineProps<{
  steps: WizardStepDto[];
  currentStep: number;
}>();

const emit = defineEmits<{
  'go-to-step': [step: number];
}>();

const isStepCompleted = (stepIndex: number) => {
  return stepIndex < props.currentStep;
};

const isStepActive = (stepIndex: number) => {
  return stepIndex === props.currentStep - 1;
};

const canNavigateToStep = (stepIndex: number) => {
  return stepIndex < props.currentStep;
};

const handleStepClick = (stepIndex: number) => {
  if (canNavigateToStep(stepIndex)) {
    emit('go-to-step', stepIndex + 1);
  }
};
</script>

<template>
  <div class="w-full">
    <div class="flex items-center justify-between">
      <template v-for="(step, index) in steps" :key="step.id">
        <button
          type="button"
          class="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-2 -ml-2 transition-all"
          :class="{
            'cursor-pointer': canNavigateToStep(index),
            'cursor-default': !canNavigateToStep(index),
          }"
          :disabled="!canNavigateToStep(index)"
          @click="handleStepClick(index)"
        >
          <div
            class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 shrink-0"
            :class="{
              'bg-primary border-primary text-primary-foreground': isStepActive(index),
              'bg-primary/10 border-primary/30 text-primary group-hover:bg-primary/20': isStepCompleted(index),
              'bg-muted border-muted-foreground/30 text-muted-foreground': !isStepActive(index) && !isStepCompleted(index),
            }"
          >
            <Check v-if="isStepCompleted(index)" class="h-5 w-5" />
            <span v-else class="text-sm font-semibold">{{ index + 1 }}</span>
          </div>

          <div class="hidden sm:block text-left">
            <p
              class="text-sm font-medium transition-colors"
              :class="{
                'text-foreground': isStepActive(index) || isStepCompleted(index),
                'text-muted-foreground': !isStepActive(index) && !isStepCompleted(index),
              }"
            >
              {{ step.title }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ step.description }}
            </p>
          </div>
        </button>

        <div
          v-if="index < steps.length - 1"
          class="flex-1 h-0.5 mx-4 transition-colors duration-300"
          :class="{
            'bg-primary': isStepCompleted(index),
            'bg-muted': !isStepCompleted(index),
          }"
        />
      </template>
    </div>
  </div>
</template>
