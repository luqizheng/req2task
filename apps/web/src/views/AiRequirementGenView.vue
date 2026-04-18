<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Edit, Close } from '@element-plus/icons-vue';
import { AIChat } from '@req2task/ai-chat';
import "@req2task/ai-chat/dist/style.css"
import type { AIChatMessage } from '@req2task/ai-chat';
import type { GenerateRequirementResponse } from '@/api/ai';
import {
  useGenerationSteps,
  createEditableRequirement,
  useRequirementEditor,
  useUserStoryEditor,
  useCriteriaEditor,
  useRequirementGeneration,
} from './AiRequirementGenView/composables';
import {
  RequirementInput,
  GenerationProgress,
  RequirementResult,
} from './AiRequirementGenView/components';

const chatRef = ref<InstanceType<typeof AIChat> | null>(null);
const showChat = ref(false);
const rawInput = ref('');

const generatedRequirement = ref<GenerateRequirementResponse | null>(null);
const editableRequirement = reactive(createEditableRequirement());

const { steps, currentStep, updateStepStatus, resetSteps, isGenerating } =
  useGenerationSteps();

const { isEditing, handleEdit, handleCancelEdit, handleSave } =
  useRequirementEditor(editableRequirement, generatedRequirement);

const { handleAddUserStory, handleRemoveUserStory } =
  useUserStoryEditor(editableRequirement);

const { handleAddCriteria, handleRemoveCriteria } =
  useCriteriaEditor(editableRequirement);

const {
  isLoading,
  generateAll,
  regenerateUserStories,
  regenerateCriteria,
  handleClear,
} = useRequirementGeneration(
  editableRequirement,
  generatedRequirement,
  updateStepStatus,
  resetSteps
);

const errorDialogVisible = ref(false);
const errorMessage = ref('');

const showError = (message: string) => {
  errorMessage.value = message || '发生未知错误';
  errorDialogVisible.value = true;
};

const chatConfig = computed(() => ({
  endpoint: '/api/ai/chat',
  sessionId: `req-gen-${Date.now()}`,
  headers: {
    'Content-Type': 'application/json',
  },
  userRoleName: '需求分析师',
  assistantRoleName: '需求助手',
}));

const handleToggleChat = () => {
  showChat.value = !showChat.value;
};

const handleChatMessage = (message: AIChatMessage) => {
  console.log('Chat message received:', message);
};

const handleChatDone = (message: AIChatMessage, conversationId: string) => {
  console.log('Chat done:', message, conversationId);
  ElMessage.info('对话已完成，请查看右侧生成结果');
};

const handleGenerateFromChat = () => {
  const chatMessages = chatRef.value?.getMessages();
  if (!chatMessages || chatMessages.length === 0) {
    ElMessage.warning('对话内容为空');
    return;
  }

  const conversationContent = chatMessages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => `${m.roleName}: ${m.content}`)
    .join('\n\n');

  if (conversationContent) {
    rawInput.value = conversationContent;
    generateAll(rawInput.value).catch((error) => showError((error as Error).message));
  }
};

const handleInputClear = () => {
  handleClear({ value: rawInput.value });
};

const handleGenerate = async () => {
  try {
    await generateAll(rawInput.value);
  } catch (error) {
    showError((error as Error).message);
  }
};

const handleRegenerate = async () => {
  try {
    await generateAll(rawInput.value);
  } catch (error) {
    showError((error as Error).message);
  }
};

const handleRegenerateUserStories = async () => {
  try {
    await regenerateUserStories();
  } catch (error) {
    showError((error as Error).message);
  }
};

const handleRegenerateCriteria = async () => {
  try {
    await regenerateCriteria();
  } catch (error) {
    showError((error as Error).message);
  }
};

const handleUserStoryRoleUpdate = (index: number, value: string) => {
  editableRequirement.userStories[index].role = value;
};

const handleUserStoryGoalUpdate = (index: number, value: string) => {
  editableRequirement.userStories[index].goal = value;
};

const handleUserStoryBenefitUpdate = (index: number, value: string) => {
  editableRequirement.userStories[index].benefit = value;
};

const handleCriteriaUpdate = (index: number, value: string) => {
  editableRequirement.acceptanceCriteria[index] = value;
};

const handleTitleUpdate = (value: string) => {
  editableRequirement.title = value;
};

const handleDescriptionUpdate = (value: string) => {
  editableRequirement.description = value;
};

const handlePriorityUpdate = (value: string) => {
  editableRequirement.priority = value;
};
</script>

<template>
  <div class="ai-requirement-gen-view">
    <div class="page-header">
      <h2 class="page-title">AI 需求生成</h2>
      <el-button
        type="primary"
        @click="handleToggleChat"
        :icon="showChat ? Close : Edit"
      >
        {{ showChat ? '关闭对话' : '开启对话' }}
      </el-button>
    </div>

    <el-card v-if="showChat" class="chat-container">
      <AIChat
        ref="chatRef"
        :config="chatConfig"
        title="需求对话助手"
        placeholder="输入您的需求描述..."
        @message-received="handleChatMessage"
        @done="handleChatDone"
      />
      <div class="chat-actions">
        <el-button type="primary" @click="handleGenerateFromChat">
          从对话生成需求
        </el-button>
        <el-button @click="chatRef?.clearMessages">清空对话</el-button>
      </div>
    </el-card>

    <el-row :gutter="24">
      <el-col :span="10">
        <RequirementInput
          v-model="rawInput"
          :is-loading="isLoading"
          @clear="handleInputClear"
          @generate="handleGenerate"
        />

        <GenerationProgress
          :steps="steps"
          :current-step="currentStep"
        />
      </el-col>

      <el-col :span="14">
        <el-card v-if="!generatedRequirement" class="empty-result">
          <el-empty description="请先输入原始需求并点击生成">
            <template #image>
              <div style="font-size: 48px; color: #c0c4cc">📝</div>
            </template>
          </el-empty>
        </el-card>

        <RequirementResult
          v-else
          :editable-requirement="editableRequirement"
          :is-editing="isEditing"
          :is-loading="isLoading"
          :is-regenerating-user-story="isGenerating('userStory')"
          :is-regenerating-criteria="isGenerating('criteria')"
          @edit="handleEdit"
          @cancel="handleCancelEdit"
          @save="handleSave"
          @regenerate="handleRegenerate"
          @add-user-story="handleAddUserStory"
          @remove-user-story="handleRemoveUserStory"
          @update-user-story-role="handleUserStoryRoleUpdate"
          @update-user-story-goal="handleUserStoryGoalUpdate"
          @update-user-story-benefit="handleUserStoryBenefitUpdate"
          @regenerate-user-stories="handleRegenerateUserStories"
          @add-criteria="handleAddCriteria"
          @remove-criteria="handleRemoveCriteria"
          @update-criteria="handleCriteriaUpdate"
          @regenerate-criteria="handleRegenerateCriteria"
          @update-title="handleTitleUpdate"
          @update-description="handleDescriptionUpdate"
          @update-priority="handlePriorityUpdate"
        />
      </el-col>
    </el-row>

    <el-dialog
      v-model="errorDialogVisible"
      title="操作失败"
      width="500px"
      :close-on-click-modal="false"
    >
      <div style="padding: 16px 0">
        <el-alert
          type="error"
          :title="errorMessage"
          :closable="false"
          show-icon
        />
      </div>
      <template #footer>
        <el-button type="primary" @click="errorDialogVisible = false">
          我知道了
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.ai-requirement-gen-view {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.chat-container {
  margin-bottom: 24px;
}

.chat-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.empty-result {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
