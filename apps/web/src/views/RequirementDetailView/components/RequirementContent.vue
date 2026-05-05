<script setup lang="ts">
import { ref, watch } from "vue";
import type { RequirementResponseDto } from "@req2task/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { ListTodo, Sparkles, Loader2 } from "lucide-vue-next";
import { aiApi, type UserStoryDraft } from "@/api/ai";
import { toast } from "vue-sonner";
import UserStoryCard from "./UserStoryCard.vue";
import UserStoryPreviewCard from "./UserStoryPreviewCard.vue";

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

const showPreviewDialog = ref(false);
const previewUserStories = ref<UserStoryDraft[]>([]);
const selectedUserStoryIndices = ref<Set<number>>(new Set());
const isSavingUserStories = ref(false);

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
    const response = await aiApi.previewUserStories(
      props.requirement.id,
      props.projectId,
      userStoryFeaturePoints.value,
      userStoryContext.value || undefined
    );
    
    previewUserStories.value = response.userStories;
    selectedUserStoryIndices.value = new Set(response.userStories.map((_, i) => i));
    showPreviewDialog.value = true;
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

const toggleUserStorySelection = (index: number) => {
  if (selectedUserStoryIndices.value.has(index)) {
    selectedUserStoryIndices.value.delete(index);
  } else {
    selectedUserStoryIndices.value.add(index);
  }
  selectedUserStoryIndices.value = new Set(selectedUserStoryIndices.value);
};

const selectAllUserStories = () => {
  selectedUserStoryIndices.value = new Set(previewUserStories.value.map((_, i) => i));
};

const deselectAllUserStories = () => {
  selectedUserStoryIndices.value = new Set();
};

const handleSaveSelectedUserStories = async () => {
  if (selectedUserStoryIndices.value.size === 0) {
    toast.error("请至少选择一个用户故事");
    return;
  }

  try {
    isSavingUserStories.value = true;
    const storiesToSave = Array.from(selectedUserStoryIndices.value).map(
      (index) => previewUserStories.value[index]
    );
    const response = await aiApi.saveUserStories(props.requirement.id, storiesToSave);
    toast.success(`成功保存 ${response.userStories.length} 个用户故事`);
    emit("user-stories-updated");
    showPreviewDialog.value = false;
    previewUserStories.value = [];
    selectedUserStoryIndices.value = new Set();
  } catch (error) {
    console.error("Failed to save user stories:", error);
    toast.error("保存用户故事失败", {
      description: error instanceof Error ? error.message : "请稍后重试",
    });
  } finally {
    isSavingUserStories.value = false;
  }
};

const closePreviewDialog = () => {
  showPreviewDialog.value = false;
  previewUserStories.value = [];
  selectedUserStoryIndices.value = new Set();
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

    <Card v-if="requirement.featurePoints">
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          功能点
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre class="whitespace-pre-wrap text-sm text-slate-700 font-mono bg-slate-50 p-3 rounded-md">{{ requirement.featurePoints }}</pre>
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
        <UserStoryCard
          v-for="story in requirement.userStories"
          :key="story.id"
          :story="story"
          :is-generating-criteria="isGeneratingCriteria === story.id"
          @generate-criteria="openCriteriaDialog"
        />
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

      <Dialog v-model:open="showPreviewDialog">
        <DialogContent class="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>预览用户故事</DialogTitle>
            <DialogDescription>
              请选择要保存的用户故事，已选 {{ selectedUserStoryIndices.size }} 个
            </DialogDescription>
          </DialogHeader>
          <div class="flex gap-2 mb-4">
            <Button variant="outline" size="sm" @click="selectAllUserStories">
              全选
            </Button>
            <Button variant="outline" size="sm" @click="deselectAllUserStories">
              取消全选
            </Button>
          </div>
          <div class="flex-1 overflow-y-auto space-y-3">
            <UserStoryPreviewCard
              v-for="(story, index) in previewUserStories"
              :key="index"
              :story="story"
              :selected="selectedUserStoryIndices.has(index)"
              @toggle="toggleUserStorySelection(index)"
            />
          </div>
          <DialogFooter class="mt-4">
            <Button
              variant="outline"
              :disabled="isSavingUserStories"
              @click="closePreviewDialog"
            >
              取消
            </Button>
            <Button
              :disabled="isSavingUserStories || selectedUserStoryIndices.size === 0"
              @click="handleSaveSelectedUserStories"
            >
              <Loader2 v-if="isSavingUserStories" class="w-4 h-4 mr-2 animate-spin" />
              {{ isSavingUserStories ? '保存中...' : `保存所选 (${selectedUserStoryIndices.size})` }}
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
