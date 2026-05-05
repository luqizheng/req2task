<script setup lang="ts">
import { ref, watch } from "vue";
import type { RequirementResponseDto, UserStorySummaryDto } from "@req2task/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ListTodo, Sparkles, Loader2, CheckCircle2 } from "lucide-vue-next";
import { Separator } from "@/components/ui/separator";
import { aiApi, type UserStoryDraft } from "@/api/ai";
import { toast } from "vue-sonner";
import UserStoryCard from "./UserStoryCard.vue";

interface UnSavedUserStory extends UserStoryDraft {
  tempId: string;
}

const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const props = defineProps<{
  requirement: RequirementResponseDto;
  projectId: string;
}>();

const emit = defineEmits<{
  (e: "description-update", description: string): void;
  (e: "feature-points-update", featurePoints: string): void;
  (e: "user-stories-added", stories: UserStorySummaryDto[]): void;
  (e: "user-stories-updated"): void;
  (e: "feature-points-generated"): void;
}>();

const isEditingDescription = ref(false);
const editedDescription = ref(props.requirement.description || "");
const isEditingFeaturePoints = ref(false);
const editedFeaturePoints = ref(props.requirement.featurePoints || "");

watch(() => props.requirement.description, (newDescription) => {
  editedDescription.value = newDescription || "";
});

watch(() => props.requirement.featurePoints, (newFeaturePoints) => {
  editedFeaturePoints.value = newFeaturePoints || "";
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

const startEditingFeaturePoints = () => {
  editedFeaturePoints.value = props.requirement.featurePoints || "";
  isEditingFeaturePoints.value = true;
};

const saveFeaturePoints = () => {
  emit("feature-points-update", editedFeaturePoints.value);
  isEditingFeaturePoints.value = false;
};

const cancelEditingFeaturePoints = () => {
  editedFeaturePoints.value = props.requirement.featurePoints || "";
  isEditingFeaturePoints.value = false;
};

const isGeneratingFeaturePoints = ref(false);

const handleGenerateFeaturePoints = async () => {
  try {
    isGeneratingFeaturePoints.value = true;
    const result = await aiApi.generateFeaturePointsForRequirement(
      props.requirement.id
    );
    editedFeaturePoints.value = result.featurePoints;
    isEditingFeaturePoints.value = true;
    toast.success("功能点已生成", {
      description: "请检查并编辑生成的内容",
    });
  } catch (error) {
    console.error("Failed to generate feature points:", error);
    toast.error("生成功能点失败", {
      description: error instanceof Error ? error.message : "请稍后重试",
    });
  } finally {
    isGeneratingFeaturePoints.value = false;
  }
};

const isGeneratingUserStories = ref(false);
const unsavedUserStories = ref<UnSavedUserStory[]>([]);
const savingStoryIds = ref<Set<string>>(new Set());

const isGeneratingCriteria = ref<string | null>(null);
const criteriaDialogUserStoryId = ref<string | null>(null);
const criteriaContext = ref("");
const showCriteriaDialog = ref(false);

const handleGenerateUserStories = async () => {
  try {
    isGeneratingUserStories.value = true;
    const response = await aiApi.previewUserStories(props.requirement.id);
    
    const newStories: UnSavedUserStory[] = response.userStories.map(story => ({
      ...story,
      tempId: generateTempId(),
    }));
    unsavedUserStories.value = [...unsavedUserStories.value, ...newStories];
    toast.success(`生成 ${newStories.length} 个用户故事`);
  } catch (error) {
    console.error("Failed to generate user stories:", error);
    toast.error("生成用户故事失败", {
      description: error instanceof Error ? error.message : "请稍后重试",
    });
  } finally {
    isGeneratingUserStories.value = false;
  }
};

const handleSaveUserStory = async (story: UnSavedUserStory) => {
  try {
    savingStoryIds.value.add(story.tempId);
    savingStoryIds.value = new Set(savingStoryIds.value);
    
    const response = await aiApi.saveUserStories(props.requirement.id, [story]);
    toast.success("用户故事已保存");
    unsavedUserStories.value = unsavedUserStories.value.filter(s => s.tempId !== story.tempId);
    const now = new Date().toISOString();
    const savedStories: UserStorySummaryDto[] = response.userStories.map(us => ({
      id: us.id,
      requirementId: props.requirement.id,
      role: us.role,
      goal: us.goal,
      benefit: us.benefit,
      storyPoints: us.storyPoints,
      acceptanceCriteria: [],
      createdAt: us.createdAt || now,
      updatedAt: now,
    }));
    emit("user-stories-added", savedStories);
  } catch (error) {
    console.error("Failed to save user story:", error);
    toast.error("保存用户故事失败", {
      description: error instanceof Error ? error.message : "请稍后重试",
    });
  } finally {
    savingStoryIds.value.delete(story.tempId);
    savingStoryIds.value = new Set(savingStoryIds.value);
  }
};

const handleRemoveUserStory = (tempId: string) => {
  unsavedUserStories.value = unsavedUserStories.value.filter(s => s.tempId !== tempId);
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            功能点
          </CardTitle>
          <div class="flex items-center gap-2">
            <Button
              v-if="!isEditingFeaturePoints"
              variant="ghost"
              size="sm"
              class="gap-2"
              @click="startEditingFeaturePoints"
            >
              {{ requirement.featurePoints ? '编辑' : '添加' }}
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="gap-2"
              :disabled="isGeneratingFeaturePoints"
              @click="handleGenerateFeaturePoints"
            >
              <Loader2 v-if="isGeneratingFeaturePoints" class="w-4 h-4 animate-spin" />
              <Sparkles v-else class="w-4 h-4" />
              AI 生成
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="isEditingFeaturePoints" class="space-y-3">
          <Textarea
            v-model="editedFeaturePoints"
            class="min-h-[150px] font-mono"
            placeholder="请输入功能点描述，例如：
1. 用户登录功能
   - 支持账号密码登录
   - 支持记住登录状态
2. 用户管理功能
   - 支持查看用户列表
   - 支持编辑用户信息"
          />
          <div class="flex justify-end gap-2">
            <button
              class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              @click="cancelEditingFeaturePoints"
            >
              取消
            </button>
            <button
              class="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              @click="saveFeaturePoints"
            >
              保存
            </button>
          </div>
        </div>
        <div v-else>
          <pre
            v-if="requirement.featurePoints"
            class="whitespace-pre-wrap text-sm text-slate-700 font-mono bg-slate-50 p-3 rounded-md cursor-pointer hover:bg-slate-100 transition-colors"
            @click="startEditingFeaturePoints"
          >{{ requirement.featurePoints }}</pre>
          <p
            v-else
            class="text-slate-400 italic cursor-pointer hover:text-blue-400 transition-colors"
            @click="startEditingFeaturePoints"
          >
            点击添加功能点...
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
            用户故事
            <Badge v-if="unsavedUserStories.length > 0" variant="secondary" class="ml-2">
              {{ unsavedUserStories.length }} 未保存
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            class="gap-2"
            :disabled="isGeneratingUserStories || !requirement.featurePoints"
            @click="handleGenerateUserStories"
          >
            <Loader2 v-if="isGeneratingUserStories" class="w-4 h-4 animate-spin" />
            <Sparkles v-else class="w-4 h-4" />
            {{ isGeneratingUserStories ? '生成中...' : 'AI 生成' }}
          </Button>
        </div>
      </CardHeader>
      <CardContent v-if="requirement.userStories && requirement.userStories.length > 0 || unsavedUserStories.length > 0" class="space-y-4">
        <UserStoryCard
          v-for="story in requirement.userStories"
          :key="story.id"
          :story="story"
          :is-generating-criteria="isGeneratingCriteria === story.id"
          @generate-criteria="openCriteriaDialog"
        />
        <div
          v-for="story in unsavedUserStories"
          :key="story.tempId"
          class="p-4 border-2 border-dashed border-amber-300 rounded-lg space-y-3 bg-amber-50/50"
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
                <Badge variant="outline" class="bg-amber-100 text-amber-700 border-amber-300">
                  未保存
                </Badge>
              </div>
              <p class="text-slate-800">
                <span class="font-medium">作为</span> {{ story.role }}
                <span class="font-medium">，我想要</span> {{ story.goal }}
                <span class="font-medium">，以便于</span> {{ story.benefit }}
              </p>
            </div>
            <div class="flex gap-2">
              <Button
                size="sm"
                class="gap-1"
                :disabled="savingStoryIds.has(story.tempId)"
                @click="handleSaveUserStory(story)"
              >
                <Loader2 v-if="savingStoryIds.has(story.tempId)" class="w-4 h-4 animate-spin" />
                保存
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="text-red-500 hover:text-red-600 hover:bg-red-50"
                @click="handleRemoveUserStory(story.tempId)"
              >
                删除
              </Button>
            </div>
          </div>
          <div v-if="story.acceptanceCriteria && story.acceptanceCriteria.length > 0">
            <Separator class="my-2" />
            <p class="text-xs font-medium text-slate-500 mb-1">验收条件:</p>
            <ul class="space-y-1">
              <li
                v-for="(criteria, cIndex) in story.acceptanceCriteria"
                :key="cIndex"
                class="flex items-start gap-2"
              >
                <CheckCircle2 class="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
                <span class="text-xs text-slate-600">{{ criteria.content }}</span>
              </li>
            </ul>
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
