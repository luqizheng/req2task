import { ref, onMounted } from "vue";
import { useAiStore } from "@/stores/ai";
import { ElMessage, ElMessageBox } from "element-plus";

export const useAiConfig = () => {
  const aiStore = useAiStore();
  const loading = ref(false);
  const deletingId = ref<string | null>(null);
  const actionLoadingId = ref<string | null>(null);

  const fetchConfigs = async () => {
    loading.value = true;
    try {
      await aiStore.fetchConfigs();
    } finally {
      loading.value = false;
    }
  };

  const deleteConfig = async (config: (typeof aiStore.configs)[0]) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除配置"${config.name}"吗？此操作不可恢复。`,
        "删除确认",
        {
          confirmButtonText: "删除",
          cancelButtonText: "取消",
          type: "warning",
        },
      );
      deletingId.value = config.id;
      await aiStore.deleteConfig(config.id);
      ElMessage.success("删除成功");
    } catch (error) {
      if (error !== "cancel") {
        ElMessage.error((error as Error).message || "删除失败");
      }
    } finally {
      deletingId.value = null;
    }
  };

  const setDefault = async (config: (typeof aiStore.configs)[0]) => {
    try {
      actionLoadingId.value = config.id;
      await aiStore.updateConfig(config.id, { isDefault: true });
      await aiStore.fetchConfigs();
      ElMessage.success("已设置为默认配置");
    } catch (error) {
      ElMessage.error((error as Error).message || "设置失败");
    } finally {
      actionLoadingId.value = null;
    }
  };

  const setActive = async (config: (typeof aiStore.configs)[0]) => {
    try {
      actionLoadingId.value = config.id;
      await aiStore.updateConfig(config.id, { isActive: true });
      await aiStore.fetchConfigs();
      ElMessage.success("已激活配置");
    } catch (error) {
      ElMessage.error((error as Error).message || "激活失败");
    } finally {
      actionLoadingId.value = null;
    }
  };

  onMounted(fetchConfigs);

  return {
    loading,
    deletingId,
    actionLoadingId,
    configs: aiStore.configs,
    fetchConfigs,
    deleteConfig,
    setDefault,
    setActive,
  };
};
