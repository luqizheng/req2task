<script setup lang="ts">
import { ref, watch } from "vue";
import type { RequirementResponseDto } from "@req2task/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ListTodo } from "lucide-vue-next";

const props = defineProps<{
  requirement: RequirementResponseDto;
}>();

const emit = defineEmits<{
  (e: "description-update", description: string): void;
}>();

const isEditingDescription = ref(false);
const editedDescription = ref(props.requirement.description || "");

watch(() => props.requirement.description, (newDescription) => {
  editedDescription.value = newDescription || "";
});

const startEditingDescription = () => {
  editedDescription.value = props.requirement.description || "";
  isEditingDescription.value = true;
};

const saveDescription = () => {
  emit("description-update", editedDescription.value);
  isEditingDescription.value = false;
};

const cancelEditingDescription = () => {
  editedDescription.value = props.requirement.description || "";
  isEditingDescription.value = false;
};

const criteriaTypeLabels: Record<string, string> = {
  functional: "功能验收",
  performance: "性能验收",
  security: "安全验收",
  usability: "易用性验收",
  compatibility: "兼容性验收",
  reliability: "可靠性验收",
};

const getCriteriaTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    functional: "bg-blue-100 text-blue-700 border-blue-300",
    performance: "bg-purple-100 text-purple-700 border-purple-300",
    security: "bg-red-100 text-red-700 border-red-300",
    usability: "bg-green-100 text-green-700 border-green-300",
    compatibility: "bg-orange-100 text-orange-700 border-orange-300",
    reliability: "bg-slate-100 text-slate-700 border-slate-300",
  };
  return colors[type] || "bg-slate-100 text-slate-700 border-slate-300";
};
</script>

<template>
  <div class="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <ListTodo class="w-5 h-5" />
          需求描述
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="isEditingDescription" class="space-y-3">
          <Textarea
            v-model="editedDescription"
            class="min-h-[120px]"
            placeholder="请输入需求描述..."
          />
          <div class="flex justify-end gap-2">
            <button
              class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              @click="cancelEditingDescription"
            >
              取消
            </button>
            <button
              class="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              @click="saveDescription"
            >
              保存
            </button>
          </div>
        </div>
        <div
          v-else
          class="group cursor-pointer"
          @click="startEditingDescription"
        >
          <p
            v-if="requirement.description"
            class="text-slate-700 whitespace-pre-wrap group-hover:text-blue-600 transition-colors"
          >
            {{ requirement.description }}
          </p>
          <p
            v-else
            class="text-slate-400 italic group-hover:text-blue-400 transition-colors"
          >
            点击添加需求描述...
          </p>
        </div>
      </CardContent>
    </Card>

    <Card v-if="requirement.userStories && requirement.userStories.length > 0">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="text-lg flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            用户故事 ({{ requirement.userStories.length }})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <div
          v-for="story in requirement.userStories"
          :key="story.id"
          class="p-4 border rounded-lg space-y-3"
        >
          <div class="flex items-start gap-3">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <Badge variant="outline" class="bg-purple-50">
                  角色: {{ story.role }}
                </Badge>
                <Badge variant="outline" class="bg-blue-50">
                  {{ story.storyPoints }} SP
                </Badge>
              </div>
              <p class="text-slate-800">
                <span class="font-medium">作为</span> {{ story.role }}
                <span class="font-medium">，我想要</span> {{ story.goal }}
                <span class="font-medium">，以便于</span> {{ story.benefit }}
              </p>
            </div>
          </div>

          <div v-if="story.acceptanceCriteria && story.acceptanceCriteria.length > 0">
            <Separator class="my-3" />
            <p class="text-sm font-medium text-slate-700 mb-2">验收条件:</p>
            <ul class="space-y-2">
              <li
                v-for="criteria in story.acceptanceCriteria"
                :key="criteria.id"
                class="flex items-start gap-2"
              >
                <CheckCircle2
                  :class="cn(
                    'w-4 h-4 mt-0.5 flex-shrink-0',
                    criteria.isChecked ? 'text-green-500' : 'text-slate-300'
                  )"
                />
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-slate-700">{{ criteria.content }}</span>
                    <Badge
                      :class="cn('text-xs', getCriteriaTypeColor(criteria.criteriaType))"
                      variant="outline"
                    >
                      {{ criteriaTypeLabels[criteria.criteriaType] || criteria.criteriaType }}
                    </Badge>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card v-if="requirement.children && requirement.children.length > 0">
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          子需求 ({{ requirement.children.length }})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <div
            v-for="child in requirement.children"
            :key="child.id"
            class="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <Circle class="w-4 h-4 text-slate-400" />
              <span class="text-slate-800">{{ child.title }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Badge
                :class="cn(
                  'text-xs',
                  child.priority === 'critical' ? 'bg-red-100 text-red-700' :
                  child.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  child.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-slate-100 text-slate-700'
                )"
              >
                {{ child.priority }}
              </Badge>
              <Badge variant="outline" class="text-xs">
                {{ child.status }}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
