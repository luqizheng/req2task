import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRequirementCollectStore } from '@/stores/requirementCollect';
import { useAiStore } from '@/stores/ai';
import type { CollectionType, CreateCollectionDto } from '@/api/requirementCollection';

export const collectionTypeOptions = [
  { value: 'meeting', label: '会议' },
  { value: 'interview', label: '访谈' },
  { value: 'document', label: '文档' },
  { value: 'other', label: '其他' },
];

export function useCollection() {
  const route = useRoute();
  const router = useRouter();
  const store = useRequirementCollectStore();
  const aiStore = useAiStore();

  const projectId = computed(() => route.params.projectId as string);
  const collectionId = computed(() => route.params.collectionId as string | undefined);

  const showCreateDialog = ref(false);
  const createForm = ref({
    title: '',
    collectionType: 'meeting' as CollectionType,
    meetingMinutes: '',
  });

  const selectedCollectionId = computed({
    get: () => store.currentCollection?.id || '',
    set: (value: string) => {
      if (value) store.selectCollection(value);
    },
  });

  const isCollectionActive = computed(() => store.currentCollection?.status === 'active');

  const handleBack = () => router.push(`/projects/${projectId.value}`);

  const loadData = async () => {
    try {
      await store.fetchCollections(projectId.value);
      if (aiStore.configs.length === 0) await aiStore.fetchConfigs();
      if (collectionId.value) await store.selectCollection(collectionId.value);
    } catch {
      ElMessage.error('加载数据失败');
    }
  };

  const handleCreate = async () => {
    if (!createForm.value.title.trim()) {
      ElMessage.warning('请输入收集标题');
      return;
    }
    try {
      const dto: CreateCollectionDto = {
        projectId: projectId.value,
        title: createForm.value.title,
        collectionType: createForm.value.collectionType,
        meetingMinutes: createForm.value.meetingMinutes || undefined,
      };
      const result = await store.createCollection(dto);
      ElMessage.success('创建成功');
      showCreateDialog.value = false;
      createForm.value = { title: '', collectionType: 'meeting', meetingMinutes: '' };
      router.replace(`/projects/${projectId.value}/collect/${result.id}`);
      await store.selectCollection(result.id);
    } catch {
      ElMessage.error('创建失败');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      await ElMessageBox.confirm(`确定删除收集"${title}"吗？`, '删除确认', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      });
      await store.deleteCollection(id);
      ElMessage.success('删除成功');
    } catch (error) {
      if ((error as Error).message !== 'cancel') ElMessage.error('删除失败');
    }
  };

  const handleComplete = async () => {
    const unclarified = store.unclarifiedRequirements;
    if (unclarified.length > 0) {
      ElMessageBox.confirm(
        `还有 ${unclarified.length} 个需求未澄清，请先澄清或删除。`,
        '无法完成收集',
        { confirmButtonText: '知道了', type: 'warning' }
      );
      return;
    }
    try {
      await ElMessageBox.confirm(
        `确定要完成这次收集吗？\n收集总数：${store.rawRequirements.length} 条`,
        '完成收集确认',
        { confirmButtonText: '确认完成', cancelButtonText: '取消', type: 'info' }
      );
      const result = await store.completeCollection();
      if (result.success) ElMessage.success('收集已完成');
      else ElMessage.warning(result.message || '完成收集失败');
    } catch (error) {
      if ((error as Error).message !== 'cancel') ElMessage.error('操作失败');
    }
  };

  return {
    projectId,
    collectionId,
    showCreateDialog,
    createForm,
    selectedCollectionId,
    isCollectionActive,
    handleBack,
    loadData,
    handleCreate,
    handleDelete,
    handleComplete,
  };
}
