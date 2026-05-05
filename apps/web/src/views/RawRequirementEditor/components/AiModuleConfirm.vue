<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { featureModulesApi } from '@/api/featureModules';
import { requirementsApi } from '@/api/requirements';
import type {
  AiGeneratedRequirementDto,
  ConfirmAiModulesDto,
} from '@req2task/dto';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Field,
  FieldLabel,
} from '@/components/ui/field';
import { Loader2, Layers, Plus, Check, Sparkles } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

interface Props {
  open: boolean;
  requirements: AiGeneratedRequirementDto[];
  projectId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:open': [value: boolean];
  confirmed: [];
}>();

const newModuleName = ref('');
const newModuleDescription = ref('');

const isLoading = ref(false);
const isConfirming = ref(false);
const confirmations = ref<Map<string, { moduleId: string | null; needsNewModule: boolean }>>(new Map());
const newModules = ref<Map<string, { name: string; description: string }>>(new Map());

const requirementsNeedingModule = computed(() =>
  props.requirements.filter((r) => !r.moduleId || r.moduleId === 'NEW')
);

const confirmedCount = computed(() =>
  Array.from(confirmations.value.values()).filter((c) => c.moduleId !== null).length
);

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.requirements.length > 0) {
      await loadConfirmations();
    }
  },
  { immediate: true }
);

async function loadConfirmations() {
  isLoading.value = true;
  confirmations.value = new Map();
  newModules.value = new Map();

  for (const req of props.requirements) {
    if (!req.moduleId || req.moduleId === 'NEW') {
      try {
        const content = `${req.title} ${req.description || ''}`;
        const result = await featureModulesApi.recommend(props.projectId, content);
        const recommendations = result.recommendations || [];

        const newModuleRec = recommendations.find((r) => r.isNew);
        if (newModuleRec && newModuleRec.suggestedName) {
          confirmations.value.set(req.id, {
            moduleId: null,
            needsNewModule: true,
          });
          newModules.value.set(req.id, {
            name: newModuleRec.suggestedName,
            description: newModuleRec.suggestedDescription || '',
          });
        } else if (recommendations.length > 0) {
          confirmations.value.set(req.id, {
            moduleId: recommendations[0].moduleId,
            needsNewModule: false,
          });
        } else {
          confirmations.value.set(req.id, {
            moduleId: null,
            needsNewModule: true,
          });
          newModules.value.set(req.id, {
            name: `${req.title.slice(0, 5)}模块`,
            description: req.description?.slice(0, 100) || '',
          });
        }
      } catch (error) {
        console.warn('Failed to load module recommendation:', error);
        confirmations.value.set(req.id, {
          moduleId: null,
          needsNewModule: true,
        });
        newModules.value.set(req.id, {
          name: `${req.title.slice(0, 5)}模块`,
          description: req.description?.slice(0, 100) || '',
        });
      }
    }
  }

  isLoading.value = false;
}

function updateConfirmation(requirementId: string, moduleId: string | null, needsNewModule: boolean) {
  confirmations.value.set(requirementId, { moduleId, needsNewModule });
}

function updateNewModuleName(requirementId: string, name: string) {
  const existing = newModules.value.get(requirementId) || { name: '', description: '' };
  newModules.value.set(requirementId, { ...existing, name });
}

function handleClose() {
  emit('update:open', false);
}

async function handleConfirm() {
  const needNewModules = Array.from(confirmations.value.values()).some((c) => c.needsNewModule);
  if (needNewModules) {
    const firstNeedNew = Array.from(confirmations.value.entries()).find(
      ([, c]) => c.needsNewModule
    );
    if (firstNeedNew && newModuleName.value) {
      const reqId = firstNeedNew[0];
      updateNewModuleName(reqId, newModuleName.value);
    }
  }

  isConfirming.value = true;
  try {
    const confirmationsArray = Array.from(confirmations.value.entries()).map(([reqId, conf]) => ({
      requirementId: reqId,
      moduleId: conf.moduleId,
    }));

    const newModulesArray = needNewModules && newModuleName.value
      ? [{
          suggestedName: newModuleName.value,
          suggestedDescription: newModuleDescription.value || undefined,
          requirementIds: Array.from(confirmations.value.entries())
            .filter(([, c]) => c.needsNewModule)
            .map(([id]) => id),
        }]
      : [];

    const dto: ConfirmAiModulesDto = {
      confirmations: confirmationsArray,
      newModules: newModulesArray,
    };

    await requirementsApi.confirmAiModules(dto);
    toast.success('模块确认成功');
    emit('confirmed');
    handleClose();
  } catch (error) {
    console.error('Failed to confirm modules:', error);
    toast.error('模块确认失败');
  } finally {
    isConfirming.value = false;
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-primary" />
          确认需求模块关联
        </DialogTitle>
        <DialogDescription>
          以下需求需要关联模块，请确认或创建新模块。已确认 {{ confirmedCount }}/{{ requirementsNeedingModule.length }} 个。
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto space-y-4 py-4">
        <div v-if="isLoading" class="flex items-center justify-center py-8">
          <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
        </div>

        <template v-else>
          <Card v-for="req in requirementsNeedingModule" :key="req.id">
            <CardHeader class="pb-2">
              <CardTitle class="text-sm flex items-center gap-2">
                <Badge variant="outline" class="font-mono text-xs">
                  {{ String(req.id).slice(0, 8) }}
                </Badge>
                {{ req.title }}
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <p v-if="req.description" class="text-xs text-muted-foreground line-clamp-2">
                {{ req.description }}
              </p>

              <div class="flex items-center gap-2">
                <Layers class="w-4 h-4 text-muted-foreground" />
                <span class="text-sm font-medium">模块关联:</span>
                <Badge v-if="confirmations.get(req.id)?.moduleId" variant="secondary">
                  <Check class="w-3 h-3 mr-1" />
                  已选择
                </Badge>
                <Badge v-else-if="confirmations.get(req.id)?.needsNewModule" variant="default">
                  <Plus class="w-3 h-3 mr-1" />
                  待创建
                </Badge>
              </div>

              <div class="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  class="h-7 text-xs"
                  @click="updateConfirmation(req.id, null, true)"
                >
                  <Plus class="w-3 h-3 mr-1" />
                  创建新模块
                </Button>
              </div>

              <div v-if="confirmations.get(req.id)?.needsNewModule" class="pl-4 border-l-2 border-primary/30 space-y-2">
                <Field>
                  <FieldLabel for="module-name" class="text-xs">模块名称</FieldLabel>
                  <Input
                    :model-value="newModules.get(req.id)?.name || ''"
                    placeholder="请输入模块名称"
                    class="h-8 text-sm"
                    @update:model-value="updateNewModuleName(req.id, String($event))"
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card v-if="requirementsNeedingModule.length === 0" class="text-center py-8">
            <CardContent>
              <Check class="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p class="text-sm text-muted-foreground">所有需求都已关联模块</p>
            </CardContent>
          </Card>
        </template>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">跳过</Button>
        <Button
          :disabled="isConfirming || confirmedCount === 0"
          @click="handleConfirm"
        >
          <Loader2 v-if="isConfirming" class="w-4 h-4 mr-2 animate-spin" />
          确认关联
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
