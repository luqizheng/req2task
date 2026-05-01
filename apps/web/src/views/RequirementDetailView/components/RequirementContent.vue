<script setup lang="ts">
import { ref, watch } from "vue";
import type { RequirementResponseDto } from "@req2task/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ListTodo, Sparkles, Loader2 } from "lucide-vue-next";
import { aiApi, type GeneratedUserStory } from "@/api/ai";
import { toast } from "vue-sonner";

const props = defineProps<{
  requirement: RequirementResponseDto;
  projectId: string;
}>();

const emit = defineEmits<{
  (e: "description-update", description: string): void;
  (e: "user-stories-updated"): void;
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

const isGeneratingUserStories = ref(false);
const showUserStoryDialog = ref(false);
const userStoryFeaturePoints = ref("");
const userStoryContext = ref("");
const generatedUserStories = ref<GeneratedUserStory[]>([]);

const isGeneratingCriteria = ref<string | null>(null);
const criteriaDialogUserStoryId = ref<string | null>(null);
const criteriaContext = ref("");
const showCriteriaDialog = ref(false);

const handleGenerateUserStories = async () => {
  if (!userStoryFeaturePoints.value.trim()) {
    toast.error("请输入功能点描述");
    return;
  }

  try {
    isGeneratingUserStories.value = true;
    const response = await aiApi.generateUserStoriesForRequirement(
      props.requirement.id,
      props.projectId,
      userStoryFeaturePoints.value,
      userStoryContext.value || undefined
    );
    
    generatedUserStories.value = response.userStories;
    toast.success(`成功生成 ${response.userStories.length} 个用户故事`);
    emit("user-stories-updated");
    showUserStoryDialog.value = false;
    userStoryFeaturePoints.value = "";
    userStoryContext.value = "";
  } catch (error) {
    console.error("Failed to generate user stories:", error);
    toast.error("生成用户故事失败", {
      description: error instanceof Error ? error.message : "请稍后重试",
    });
  } finally {
    isGeneratingUserStories.value = false;
  }
};

const openCriteriaDialog = (userStoryId: string) => {
  criteriaDialogUserStoryId.value = userStoryId;
  criteriaContext.value = "";
  showCriteriaDialog.value = true;
};

const handleGenerateCriteria = async () => {
  if (!criteriaDialogUserStoryId.value) return;

  try {
    isGeneratingCriteria.value = criteriaDialogUserStoryId.value;
    const response = await aiApi.generateAcceptanceCriteriaForUserStory(
      criteriaDialogUserStoryId.value,
      criteriaContext.value || undefined
    );
    
    toast.success(`成功生成 ${response.acceptanceCriteria.length} 个验收条件`);
    emit("user-stories-updated");
    showCriteriaDialog.value = false;
    criteriaDialogUserStoryId.value = null;
    criteriaContext.value = "";
  } catch (error) {
    console.error("Failed to generate acceptance criteria:", error);
    toast.error("生成验收条件失败", {
      description: error instanceof Error ? error.message : "请稍后重试",
    });
  } finally {
    isGeneratingCriteria.value = null;
  }
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

    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="text-lg flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            用户故事 ({{ requirement.userStories?.length || 0 }})
          </CardTitle>
          <Dialog v-model:open="showUserStoryDialog">
            <DialogTrigger as-child>
              <Button variant="outline" size="sm" class="gap-2">
                <Sparkles class="w-4 h-4" />
                AI 生成
              </Button>
            </DialogTrigger>
            <DialogContent class="max-w-lg">
              <DialogHeader>
                <DialogTitle>AI 生成用户故事</DialogTitle>
                <DialogDescription>
                  描述功能点，AI 将自动生成用户故事
                </DialogDescription>
              </DialogHeader>
              <div class="space-y-4 py-4">
                <div class="space-y-2">
                  <Label for="feature-points">功能点描述 <span class="text-red-500">*</span></Label>
                  <Textarea
                    id="feature-points"
                    v-model="userStoryFeaturePoints"
                    placeholder="请描述需要实现的功能点，例如：用户登录功能，包括账号密码验证、记住登录状态..."
                    class="min-h-[100px]"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="context">附加上下文（可选）</Label>
                  <Input
                    id="context"
                    v-model="userStoryContext"
                    placeholder="补充项目背景、技术栈、约束条件等"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  :disabled="isGeneratingUserStories"
                  @click="showUserStoryDialog = false"
                >
                  取消
                </Button>
                <Button
                  :disabled="isGeneratingUserStories || !userStoryFeaturePoints.trim()"
                  @click="handleGenerateUserStories"
                >
                  <Loader2 v-if="isGeneratingUserStories" class="w-4 h-4 mr-2 animate-spin" />
                  {{ isGeneratingUserStories ? '生成中...' : '生成用户故事' }}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent v-if="requirement.userStories && requirement.userStories.length > 0" class="space-y-4">
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
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-slate-700">验收条件:</p>
              <Button
                variant="ghost"
                size="sm"
                class="gap-1 text-xs text-blue-600 hover:text-blue-700"
                @click="openCriteriaDialog(story.id)"
              >
                <Sparkles class="w-3 h-3" />
                AI 补充
              </Button>
            </div>
            <ul class="space-y-2">
              <li
                v-for="criteria in story.acceptanceCriteria"
                :key="criteria.id"
                class="flex items-start gap-2"
              >
                <CheckCircle2
                  class="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-300"
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
          <div v-else class="mt-3">
            <Separator class="my-3" />
            <Button
              variant="outline"
              size="sm"
              class="gap-2"
              @click="openCriteriaDialog(story.id)"
            >
              <Sparkles class="w-4 h-4" />
              AI 生成验收条件
            </Button>
          </div>
        </div>
      </CardContent>
      <CardContent v-else>
        <div class="text-center py-8 text-slate-400">
          <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p class="text-sm">暂无用户故事</p>
          <p class="text-xs mt-1">点击上方"AI 生成"按钮创建用户故事</p>
        </div>
      </CardContent>

      <Dialog v-model:open="showCriteriaDialog">
        <DialogContent class="max-w-lg">
          <DialogHeader>
            <DialogTitle>AI 生成验收条件</DialogTitle>
            <DialogDescription>
              描述功能上下文，AI 将自动生成验收条件
            </DialogDescription>
          </DialogHeader>
          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label for="criteria-context">附加上下文（可选）</Label>
              <Textarea
                id="criteria-context"
                v-model="criteriaContext"
                placeholder="补充验收标准、边界条件、特殊场景等"
                class="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              :disabled="isGeneratingCriteria !== null"
              @click="showCriteriaDialog = false"
            >
              取消
            </Button>
            <Button
              :disabled="isGeneratingCriteria !== null"
              @click="handleGenerateCriteria"
            >
              <Loader2 v-if="isGeneratingCriteria !== null" class="w-4 h-4 mr-2 animate-spin" />
              {{ isGeneratingCriteria !== null ? '生成中...' : '生成验收条件' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
