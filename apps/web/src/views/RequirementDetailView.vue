<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Edit, Delete, Plus, Check, Close } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRequirementStore } from '@/stores/requirement';
import type { UpdateRequirementDto, CreateUserStoryDto, UpdateUserStoryDto, CreateAcceptanceCriteriaDto } from '@req2task/dto';
import type { UserStoryResponseDto, AcceptanceCriteriaResponseDto } from '@req2task/dto';

const route = useRoute();
const router = useRouter();
const requirementStore = useRequirementStore();
const loading = ref(false);
const isEditing = ref(false);
const activeTab = ref('info');

const requirementId = computed(() => route.params.id as string);

const infoFormRef = ref<FormInstance>();
const infoForm = reactive({
  title: '',
  description: '',
  priority: '',
  storyPoints: 0,
});

const infoRules: FormRules = {
  title: [{ required: true, message: '请输入需求标题', trigger: 'blur' }],
};

const userStoryDialogVisible = ref(false);
const userStoryDialogTitle = ref('添加用户故事');
const userStoryFormRef = ref<FormInstance>();
const userStoryForm = reactive({
  id: null as string | null,
  role: '',
  goal: '',
  benefit: '',
  storyPoints: 0,
});
const userStoryFormRules: FormRules = {
  role: [{ required: true, message: '请输入角色', trigger: 'blur' }],
  goal: [{ required: true, message: '请输入目标', trigger: 'blur' }],
  benefit: [{ required: true, message: '请输入收益', trigger: 'blur' }],
};

const acDialogVisible = ref(false);
const acFormRef = ref<FormInstance>();
const acForm = reactive({
  criteriaType: 'functional',
  content: '',
  testMethod: '',
});
const acFormRules: FormRules = {
  criteriaType: [{ required: true, message: '请选择类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入验收条件', trigger: 'blur' }],
};

const currentUserStoryId = ref<string | null>(null);

const Priority = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

const RequirementStatus = {
  DRAFT: 'draft',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

const CriteriaType = {
  FUNCTIONAL: 'functional',
  PERFORMANCE: 'performance',
  SECURITY: 'security',
  USABILITY: 'usability',
  COMPATIBILITY: 'compatibility',
} as const;

const priorityOptions = [
  { value: Priority.CRITICAL, label: '紧急' },
  { value: Priority.HIGH, label: '高' },
  { value: Priority.MEDIUM, label: '中' },
  { value: Priority.LOW, label: '低' },
];

const statusOptions = [
  { value: RequirementStatus.DRAFT, label: '草稿' },
  { value: RequirementStatus.REVIEWED, label: '已评审' },
  { value: RequirementStatus.APPROVED, label: '已批准' },
  { value: RequirementStatus.REJECTED, label: '已拒绝' },
  { value: RequirementStatus.PROCESSING, label: '进行中' },
  { value: RequirementStatus.COMPLETED, label: '已完成' },
  { value: RequirementStatus.CANCELLED, label: '已取消' },
];

const criteriaTypeOptions = [
  { value: CriteriaType.FUNCTIONAL, label: '功能性' },
  { value: CriteriaType.PERFORMANCE, label: '性能' },
  { value: CriteriaType.SECURITY, label: '安全性' },
  { value: CriteriaType.USABILITY, label: '易用性' },
  { value: CriteriaType.COMPATIBILITY, label: '兼容性' },
];

const loadRequirement = async () => {
  loading.value = true;
  try {
    await requirementStore.fetchRequirementById(requirementId.value);
    if (requirementStore.currentRequirement) {
      infoForm.title = requirementStore.currentRequirement.title;
      infoForm.description = requirementStore.currentRequirement.description || '';
      infoForm.priority = requirementStore.currentRequirement.priority;
      infoForm.storyPoints = requirementStore.currentRequirement.storyPoints;
    }
    await requirementStore.fetchUserStories(requirementId.value);
  } finally {
    loading.value = false;
  }
};

const handleEditInfo = () => {
  isEditing.value = true;
};

const handleCancelEdit = () => {
  if (requirementStore.currentRequirement) {
    infoForm.title = requirementStore.currentRequirement.title;
    infoForm.description = requirementStore.currentRequirement.description || '';
    infoForm.priority = requirementStore.currentRequirement.priority;
  }
  isEditing.value = false;
};

const handleSaveInfo = async () => {
  if (!infoFormRef.value) return;
  await infoFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const updateData: UpdateRequirementDto = {
          title: infoForm.title,
          description: infoForm.description,
          priority: infoForm.priority as UpdateRequirementDto['priority'],
        };
        await requirementStore.updateRequirement(requirementId.value, updateData);
        ElMessage.success('保存成功');
        isEditing.value = false;
      } catch (error) {
        ElMessage.error((error as Error).message || '保存失败');
      }
    }
  });
};

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定删除此需求吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await requirementStore.deleteRequirement(requirementId.value);
    ElMessage.success('删除成功');
    router.back();
  } catch (error) {
    if ((error as Error).message !== 'cancel') {
      ElMessage.error((error as Error).message || '删除失败');
    }
  }
};

const handleAddUserStory = () => {
  userStoryDialogTitle.value = '添加用户故事';
  Object.assign(userStoryForm, { id: null, role: '', goal: '', benefit: '', storyPoints: 0 });
  userStoryDialogVisible.value = true;
};

const handleEditUserStory = (row: UserStoryResponseDto) => {
  userStoryDialogTitle.value = '编辑用户故事';
  Object.assign(userStoryForm, {
    id: row.id,
    role: row.role,
    goal: row.goal,
    benefit: row.benefit,
    storyPoints: row.storyPoints,
  });
  userStoryDialogVisible.value = true;
};

const handleDeleteUserStory = async (row: UserStoryResponseDto) => {
  try {
    await ElMessageBox.confirm(`确定删除用户故事 "${row.role}-${row.goal}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await requirementStore.deleteUserStory(row.id);
    ElMessage.success('删除成功');
    await requirementStore.fetchUserStories(requirementId.value);
  } catch (error) {
    if ((error as Error).message !== 'cancel') {
      ElMessage.error((error as Error).message || '删除失败');
    }
  }
};

const handleSubmitUserStory = async () => {
  if (!userStoryFormRef.value) return;
  await userStoryFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (userStoryForm.id) {
          const updateData: UpdateUserStoryDto = {
            role: userStoryForm.role,
            goal: userStoryForm.goal,
            benefit: userStoryForm.benefit,
            storyPoints: userStoryForm.storyPoints,
          };
          await requirementStore.updateUserStory(userStoryForm.id, updateData);
        } else {
          const createData: CreateUserStoryDto = {
            role: userStoryForm.role,
            goal: userStoryForm.goal,
            benefit: userStoryForm.benefit,
            storyPoints: userStoryForm.storyPoints,
          };
          await requirementStore.createUserStory(requirementId.value, createData);
        }
        ElMessage.success('保存成功');
        userStoryDialogVisible.value = false;
        await requirementStore.fetchUserStories(requirementId.value);
      } catch (error) {
        ElMessage.error((error as Error).message || '操作失败');
      }
    }
  });
};

const handleAddAC = (userStoryId: string) => {
  currentUserStoryId.value = userStoryId;
  Object.assign(acForm, { criteriaType: CriteriaType.FUNCTIONAL, content: '', testMethod: '' });
  acDialogVisible.value = true;
};

const handleDeleteAC = async (ac: AcceptanceCriteriaResponseDto) => {
  try {
    await ElMessageBox.confirm('确定删除此验收条件吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await requirementStore.deleteAcceptanceCriteria(ac.id);
    ElMessage.success('删除成功');
    await requirementStore.fetchUserStories(requirementId.value);
  } catch (error) {
    if ((error as Error).message !== 'cancel') {
      ElMessage.error((error as Error).message || '删除失败');
    }
  }
};

const handleSubmitAC = async () => {
  if (!acFormRef.value || !currentUserStoryId.value) return;
  await acFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const createData: CreateAcceptanceCriteriaDto = {
          criteriaType: acForm.criteriaType as CreateAcceptanceCriteriaDto['criteriaType'],
          content: acForm.content,
          testMethod: acForm.testMethod,
        };
        await requirementStore.createAcceptanceCriteria(currentUserStoryId.value!, createData);
        ElMessage.success('添加成功');
        acDialogVisible.value = false;
        await requirementStore.fetchUserStories(requirementId.value);
      } catch (error) {
        ElMessage.error((error as Error).message || '操作失败');
      }
    }
  });
};

const getStatusLabel = (status: string) => statusOptions.find(s => s.value === status)?.label || status;
const getCriteriaTypeLabel = (type: string) => criteriaTypeOptions.find(t => t.value === type)?.label || type;

onMounted(() => {
  loadRequirement();
});
</script>

<template>
  <div class="requirement-detail" v-loading="loading">
    <div class="page-header">
      <el-button @click="router.back()">返回</el-button>
      <h2 class="page-title">需求详情</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="Edit" @click="handleEditInfo">编辑</el-button>
        <el-button type="danger" :icon="Delete" @click="handleDelete">删除</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="detail-tabs">
      <el-tab-pane label="基本信息" name="info">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="card-title">基本信息</span>
              <template v-if="!isEditing">
                <el-button type="primary" size="small" :icon="Edit" @click="handleEditInfo">编辑</el-button>
              </template>
              <template v-else>
                <el-button size="small" :icon="Close" @click="handleCancelEdit">取消</el-button>
                <el-button type="success" size="small" :icon="Check" @click="handleSaveInfo">保存</el-button>
              </template>
            </div>
          </template>
          <el-form ref="infoFormRef" :model="infoForm" :rules="infoRules" label-width="100" :disabled="!isEditing">
            <el-form-item label="标题" prop="title">
              <el-input v-model="infoForm.title" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="infoForm.description" type="textarea" :rows="4" />
            </el-form-item>
            <el-form-item label="优先级">
              <el-select v-model="infoForm.priority" style="width: 100%">
                <el-option v-for="p in priorityOptions" :key="p.value" :label="p.label" :value="p.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-tag>{{ getStatusLabel(requirementStore.currentRequirement?.status || '') }}</el-tag>
            </el-form-item>
            <el-form-item label="故事点">
              <span>{{ infoForm.storyPoints }}</span>
            </el-form-item>
            <el-form-item label="创建时间">
              <span>{{ requirementStore.currentRequirement?.createdAt ? new Date(requirementStore.currentRequirement.createdAt).toLocaleString() : '-' }}</span>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="用户故事" name="stories">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="card-title">用户故事</span>
              <el-button type="primary" size="small" :icon="Plus" @click="handleAddUserStory">添加</el-button>
            </div>
          </template>
          <div class="user-story-list">
            <div v-for="story in requirementStore.currentUserStories" :key="story.id" class="user-story-item">
              <div class="story-header">
                <div class="story-format">
                  <div class="story-line"><strong>作为</strong> {{ story.role }}</div>
                  <div class="story-line"><strong>我希望</strong> {{ story.goal }}</div>
                  <div class="story-line"><strong>以便于</strong> {{ story.benefit }}</div>
                </div>
                <div class="story-actions">
                  <el-button type="primary" link size="small" @click="handleAddAC(story.id)">添加验收条件</el-button>
                  <el-button type="primary" link size="small" @click="handleEditUserStory(story)">编辑</el-button>
                  <el-button type="danger" link size="small" @click="handleDeleteUserStory(story)">删除</el-button>
                </div>
              </div>
              <div class="story-meta">
                <el-tag size="small">故事点: {{ story.storyPoints }}</el-tag>
              </div>
              <div v-if="story.acceptanceCriteria?.length" class="ac-list">
                <div v-for="ac in story.acceptanceCriteria" :key="ac.id" class="ac-item">
                  <el-tag size="small" type="info">{{ getCriteriaTypeLabel(ac.criteriaType) }}</el-tag>
                  <span class="ac-content">{{ ac.content }}</span>
                  <el-button type="danger" link size="small" @click="handleDeleteAC(ac as AcceptanceCriteriaResponseDto)">删除</el-button>
                </div>
              </div>
            </div>
            <div v-if="!requirementStore.currentUserStories.length" class="empty-tip">暂无用户故事</div>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="userStoryDialogVisible" :title="userStoryDialogTitle" width="500px" destroy-on-close>
      <el-form ref="userStoryFormRef" :model="userStoryForm" :rules="userStoryFormRules" label-width="80">
        <el-form-item label="角色(Role)" prop="role">
          <el-input v-model="userStoryForm.role" placeholder="如: 产品经理" />
        </el-form-item>
        <el-form-item label="目标(Goal)" prop="goal">
          <el-input v-model="userStoryForm.goal" placeholder="如: 能够快速创建项目" />
        </el-form-item>
        <el-form-item label="收益(Benefit)" prop="benefit">
          <el-input v-model="userStoryForm.benefit" placeholder="如: 提高团队协作效率" />
        </el-form-item>
        <el-form-item label="故事点">
          <el-input-number v-model="userStoryForm.storyPoints" :min="0" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userStoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitUserStory">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="acDialogVisible" title="添加验收条件" width="500px" destroy-on-close>
      <el-form ref="acFormRef" :model="acForm" :rules="acFormRules" label-width="80">
        <el-form-item label="类型" prop="criteriaType">
          <el-select v-model="acForm.criteriaType" style="width: 100%">
            <el-option v-for="t in criteriaTypeOptions" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="条件(Given-When-Then)" prop="content">
          <el-input v-model="acForm.content" type="textarea" :rows="3" placeholder="请输入验收条件" />
        </el-form-item>
        <el-form-item label="测试方法">
          <el-input v-model="acForm.testMethod" placeholder="如: 单元测试" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="acDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitAC">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.requirement-detail {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.page-title {
  flex: 1;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.user-story-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-story-item {
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.story-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.story-format {
  flex: 1;
}

.story-line {
  margin-bottom: 8px;
  color: #1e293b;
}

.story-actions {
  display: flex;
  gap: 8px;
}

.story-meta {
  margin-top: 12px;
}

.ac-list {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;
}

.ac-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.ac-content {
  flex: 1;
}

.empty-tip {
  text-align: center;
  color: #94a3b8;
  padding: 40px;
}
</style>
