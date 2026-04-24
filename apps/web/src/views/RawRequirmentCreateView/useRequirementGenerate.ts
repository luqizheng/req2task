import { ElMessage } from "element-plus";
import { useRawRequirementCreateStore } from "./store";
import { aiApi } from "@/api/ai";

export function useRequirementGenerate(store: ReturnType<typeof useRawRequirementCreateStore>) {
  const handleGenerate = async () => {
    if (!store.rawRequirement.id) {
      ElMessage.error("缺少原始需求数据");
      return;
    }

    const source = store.rawRequirement.source?.trim();
    if (!source) {
      ElMessage.error("请填写需求来源");
      return;
    }

    store.setIsGenerating(true);

    try {
      const result = await aiApi.generateFromRaw(store.rawRequirement.id);
      store.setGeneratedRequirement({
        id: result.id || crypto.randomUUID(),
        title: result.title || "未命名需求",
        description: result.description || "",
        priority: result.priority || "medium",
        acceptanceCriteria: result.acceptanceCriteria || [],
        userStories: result.userStories || [],
      });
      ElMessage.success("需求生成成功");
    } catch (error) {
      ElMessage.error((error as Error).message || "生成失败");
    } finally {
      store.setIsGenerating(false);
    }
  };

  return {
    handleGenerate,
  };
}
