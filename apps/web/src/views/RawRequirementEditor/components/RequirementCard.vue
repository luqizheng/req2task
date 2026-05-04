<template>
  <div
    class="rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
    :class="{
      'ring-2 ring-primary/50': isEditing,
      'ring-2 ring-red-500/50': checkResult?.hasDuplicate,
      'ring-2 ring-orange-500/50': checkResult?.hasConflict && !checkResult?.hasDuplicate,
    }"
    @click="!isEditing && enterEditMode()"
  >
    <!-- View Mode -->
    <template v-if="!isEditing">
      <!-- Header -->
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex items-center gap-2 min-w-0">
          <div
            class="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0"
          >
            {{ props.index + 1 }}
          </div>
          <h3 class="text-sm font-semibold text-foreground truncate">
            {{ props.requirement.title }}
          </h3>
        </div>
        <div class="flex items-center gap-2">
          <Button
            v-if="checkResult?.hasDuplicate"
            variant="ghost"
            size="sm"
            class="h-6 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
            @click.stop="openDuplicateDetails"
          >
            <AlertTriangle class="w-3 h-3 mr-1" />
            重复
          </Button>
          <Button
            v-else-if="checkResult?.hasConflict"
            variant="ghost"
            size="sm"
            class="h-6 px-2 text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-50"
            @click.stop="openConflictDetails"
          >
            <AlertCircle class="w-3 h-3 mr-1" />
            冲突
          </Button>
          <span :title="isPersisted ? '已持久化' : '未持久化'">
            <Cloud
              v-if="isPersisted"
              class="w-4 h-4 text-muted-foreground text-green-500"
            />
            <CloudOff v-else class="w-4 h-4 text-muted-foreground" />
          </span>

          <Badge :variant="priorityVariant" class="text-xs h-5 shrink-0">
            {{ priorityLabel }}
          </Badge>
        </div>
      </div>

      <!-- Description -->
      <p
        class="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3"
      >
        {{ props.requirement.content }}
      </p>

      <!-- Tags -->
      <div class="flex flex-wrap gap-1.5 mb-3">
        <Badge
          v-for="tag in displayTags"
          :key="tag"
          variant="secondary"
          class="text-[10px] h-5 px-1.5"
        >
          {{ tag }}
        </Badge>
      </div>
    </template>

    <!-- Edit Mode -->
    <template v-else>
      <div class="space-y-3">
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">标题</label>
          <Input
            v-model="editingTitle"
            placeholder="请输入标题"
            class="h-8 text-sm"
            @click.stop
          />
        </div>
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">内容</label>
          <Textarea
            v-model="editingContent"
            placeholder="请输入内容"
            class="text-sm min-h-20"
            @click.stop
          />
        </div>
        <div class="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            class="h-7 text-xs flex-1"
            @click.stop="cancelEdit"
          >
            <X class="w-3 h-3 mr-1" />
            取消
          </Button>
          <Button
            size="sm"
            variant="destructive"
            class="h-7 text-xs flex-1"
            :disabled="isDeleting"
            @click.stop="handleDelete"
          >
            <Loader2 v-if="isDeleting" class="w-3 h-3 mr-1 animate-spin" />
            <Trash2 v-else class="w-3 h-3 mr-1" />
            {{ isDeleting ? "删除中..." : "删除" }}
          </Button>
          <Button
            size="sm"
            class="h-7 text-xs flex-1 transition-all"
            :class="{ 'scale-95': isSaving }"
            :disabled="isSaving"
            @click.stop="saveEdit"
          >
            <Loader2 v-if="isSaving" class="w-3 h-3 mr-1 animate-spin" />
            <Save v-else class="w-3 h-3 mr-1" />
            {{ isSaving ? "保存中..." : "保存" }}
          </Button>
        </div>
      </div>
    </template>
  </div>

  <!-- Duplicate Details Dialog -->
  <Dialog v-model:open="showDuplicateDetails">
    <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <AlertTriangle class="w-5 h-5 text-red-500" />
          重复需求检测
        </DialogTitle>
        <DialogDescription>
          当前需求与以下需求高度相似，请选择保留哪个需求
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div class="p-4 border rounded-lg bg-red-50">
          <h4 class="font-medium text-sm mb-2">当前需求</h4>
          <p class="text-sm font-semibold">{{ props.requirement.title }}</p>
          <p class="text-xs text-muted-foreground mt-1">{{ props.requirement.content }}</p>
        </div>
        <div class="border-t pt-4">
          <h4 class="font-medium text-sm mb-3 text-muted-foreground">相似需求</h4>
          <div class="space-y-3">
            <div
              v-for="dup in checkResult?.duplicateRequirements"
              :key="dup.id"
              class="p-3 border rounded-lg"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">{{ dup.title }}</span>
                <Badge variant="secondary" class="text-xs">
                  相似度 {{ (dup.score * 100).toFixed(0) }}%
                </Badge>
              </div>
              <p class="text-xs text-muted-foreground">{{ dup.content }}</p>
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="showDuplicateDetails = false">
          关闭
        </Button>
        <Button variant="destructive" :disabled="isDeleting" @click="handleKeepExisting">
          <Loader2 v-if="isDeleting" class="w-3 h-3 mr-1 animate-spin" />
          保留现有需求
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Conflict Details Dialog -->
  <Dialog v-model:open="showConflictDetails">
    <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <AlertCircle class="w-5 h-5 text-orange-500" />
          冲突需求检测
        </DialogTitle>
        <DialogDescription>
          {{ checkResult?.conflictDescription || '当前需求与以下需求存在逻辑冲突' }}
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div class="p-4 border rounded-lg bg-orange-50">
          <h4 class="font-medium text-sm mb-2">当前需求</h4>
          <p class="text-sm font-semibold">{{ props.requirement.title }}</p>
          <p class="text-xs text-muted-foreground mt-1">{{ props.requirement.content }}</p>
        </div>
        <div class="border-t pt-4">
          <h4 class="font-medium text-sm mb-3 text-muted-foreground">冲突需求</h4>
          <div class="space-y-3">
            <div
              v-for="conflict in checkResult?.conflictRequirements"
              :key="conflict.id"
              class="p-3 border rounded-lg"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">{{ conflict.title }}</span>
                <Badge variant="secondary" class="text-xs">
                  相似度 {{ (conflict.score * 100).toFixed(0) }}%
                </Badge>
              </div>
              <p class="text-xs text-muted-foreground">{{ conflict.content }}</p>
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="showConflictDetails = false">
          关闭
        </Button>
        <Button variant="destructive" :disabled="isDeleting" @click="handleDelete">
          <Loader2 v-if="isDeleting" class="w-3 h-3 mr-1 animate-spin" />
          删除当前需求
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { toast } from "vue-sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Cloud, CloudOff, Loader2, Save, Trash2, X, AlertTriangle, AlertCircle } from "lucide-vue-next";
import { Priority, AiGeneratedRequirementDto } from "@req2task/dto";
import { useRawRequirementCreateStore } from "../store";
import { requirementsApi } from "@/api/requirements";

interface Props {
  requirement: AiGeneratedRequirementDto;
  index: number;
  tags?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  tags: () => [],
});

const store = useRawRequirementCreateStore();
const isSaving = ref(false);
const isDeleting = ref(false);
const isEditing = ref(false);
const editingTitle = ref("");
const editingContent = ref("");
const showDuplicateDetails = ref(false);
const showConflictDetails = ref(false);

const checkResult = computed(() => {
  return store.getCheckResultForRequirement(props.requirement.id);
});

const isPersisted = computed(() => {
  return props.requirement.id && !props.requirement.id.startsWith("rq_");
});

const enterEditMode = () => {
  editingTitle.value = props.requirement.title || "";
  editingContent.value = props.requirement.content || "";
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
};

const saveEdit = async () => {
  store.updateRequirement(props.requirement.id, {
    title: editingTitle.value,
    content: editingContent.value,
  });
  toast.success("需求更新成功");
  isEditing.value = false;
};

const handleDelete = async () => {
  isDeleting.value = true;
  try {
    if (isPersisted.value) {
      await requirementsApi.delete(props.requirement.id);
    }
    store.deleteRequirement(props.requirement.id);
    toast.success("删除成功");
  } catch (error) {
    toast.error("删除失败", {
      description: error instanceof Error ? error.message : "无法删除需求",
    });
  } finally {
    isDeleting.value = false;
    showDuplicateDetails.value = false;
    showConflictDetails.value = false;
  }
};

const openDuplicateDetails = () => {
  showDuplicateDetails.value = true;
};

const openConflictDetails = () => {
  showConflictDetails.value = true;
};

const handleKeepExisting = async () => {
  isDeleting.value = true;
  try {
    if (isPersisted.value) {
      await requirementsApi.delete(props.requirement.id);
    }
    store.deleteRequirement(props.requirement.id);
    toast.success("已删除当前需求，保留现有需求");
  } catch (error) {
    toast.error("删除失败", {
      description: error instanceof Error ? error.message : "无法删除需求",
    });
  } finally {
    isDeleting.value = false;
    showDuplicateDetails.value = false;
  }
};

const priorityVariant = computed(() => {
  const variantMap: Record<
    Priority,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    critical: "destructive",
    high: "default",
    medium: "secondary",
    low: "outline",
  };
  return variantMap[(props.requirement.priority as Priority) || Priority.LOW];
});

const priorityLabel = computed(() => {
  const labelMap: Record<Priority, string> = {
    critical: "高优先级",
    high: "高优先级",
    medium: "中优先级",
    low: "低优先级",
  };
  return labelMap[(props.requirement.priority as Priority) || Priority.LOW];
});

const displayTags = computed(() => {
  if (
    props.requirement.keyElements &&
    props.requirement.keyElements.length > 0
  ) {
    return props.requirement.keyElements;
  }
  return props.tags.length > 0 ? props.tags : ["需求"];
});
</script>
