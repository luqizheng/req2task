<template>
  <div
    class="rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
    :class="{ 'ring-2 ring-primary/50': isEditing }"
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
            @click.stop="handleDelete"
          >
            <Trash2 class="w-3 h-3 mr-1" />
            删除
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
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { toast } from "vue-sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Cloud, CloudOff, Loader2, Save, Trash2, X } from "lucide-vue-next";
import { Priority, AiGeneratedRequirementDto } from "@req2task/dto";
import { useRawRequirementCreateStore } from "../store";

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
const isEditing = ref(false);
const editingTitle = ref("");
const editingContent = ref("");

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

const handleDelete = () => {
  store.deleteRequirement(props.requirement.id);
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
