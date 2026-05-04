import { toast } from "vue-sonner";
import { useRawRequirementCreateStore, type AiQuestion } from "./store";

import {
  AiSubmitRequestDto,
  GenerateRawRequirementByLLMDto,
  AiGeneratedRequirementDto,
  RequirementDto,
} from "@req2task/dto";
import { useJsonStream } from "../../utils/useJson";
import { rawRequirementsApi } from "@/api/rawRequirements";
import { requirementsApi } from "@/api/requirements";
import { aiApi } from "@/api/ai";
import { useSSEStream } from "@/utils/useSSEStream";

export function useRequirementSubmit(
  store: ReturnType<typeof useRawRequirementCreateStore>,
) {
  const sseGenerateQuestionStream = useSSEStream({
    url: `/api/raw-requirements/${store.projectId}/stream`,
  });
  const sseGenerateRequirementsStream = useSSEStream({
    url: `/api/requirements/generate/stream`,
  });

  const handleSuccess = (data: {
    request: AiSubmitRequestDto;
    response: string;
  }) => {
    const { request } = data;
    if (!data) {
      toast.warning("未收到有效数据");
      return;
    }

    store.rawRequirement.content = [
      store.rawRequirement.content ?? "",
      request.message,
    ].join("\n");
  };

  const handleError = (error: Error) => {
    toast.error(error.message || "提交失败");
  };

  const jsonHelperQuestAndAnswer = useJsonStream([
    {
      trigger: "questions",
      onArrayItem(item) {
        store.addQuestionFromSSE(item as AiQuestion);
      },
    },
    {
      trigger: "keyElements",
      onArrayItem(item) {
        if (!store.rawRequirement.keyElements)
          store.rawRequirement.keyElements = [];
        store.rawRequirement.keyElements.push(item);
      },
    },
  ]);

  const jsonHelperRequirements = useJsonStream([
    {
      trigger: "requirements",
      onArrayItem(item) {
        store.addRequirement({
          id: `rq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...item,
          projectId: store.projectId,
        });
      },
      onObject() {},
    },
  ]);

  const save = async (): Promise<boolean> => {
    try {
      const requirementDto = {
        title: store.rawRequirement.title || undefined,
        content: store.rawRequirement.content,
        source: store.rawRequirement.source || undefined,
        collectionType: store.rawRequirement.collectionType,
        collectTime: store.rawRequirement.collectTime || undefined,
        fileIds: store.rawRequirement.fileIds,
        questionAndAnswers: store.rawRequirement.questionAndAnswers,
        keyElements: store.rawRequirement.keyElements,
      };

      const result = !store.rawRequirement.id
        ? await rawRequirementsApi.create(store.projectId, requirementDto)
        : await rawRequirementsApi.update(store.rawRequirement.id, requirementDto);

      if (result) {
        if (!store.rawRequirement.id) {
          toast.success("创建成功");
          store.rawRequirement.id = result.id;
        } else {
          toast.success("更新成功");
        }

        return true;
      }
      return false;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建失败");
      return false;
    }
  };

  const rawRequirementAnalyze = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const analyzerData = {
        conversationText: store.rawRequirement.content,
        previousQuestions: store.rawRequirement.questionAndAnswers,
      } as GenerateRawRequirementByLLMDto;

      sseGenerateQuestionStream.submitStream(analyzerData, {
        onAnalyzeStart: (event) => {
          store.rawRequirement.conversationId = event.collectionId;
        },
        onConversationStart: () => {},
        onContent: (content) => {
          jsonHelperQuestAndAnswer.feed(content);
        },
        onMessage: () => {},
        onDone: () => {
          toast.success("分析完成");
          resolve();
        },
        onError: (error) => {
          toast.error(error.message || "分析失败");
          reject(new Error(error.message || "分析失败"));
        },
      });
    });
  };

  const generateRequirements = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const data = {
        rawRequirementId: store.rawRequirement.id,
      };
      sseGenerateRequirementsStream.submitStream(data, {
        onAnalyzeStart: (event) => {
          store.rawRequirement.conversationId = event.collectionId;
        },
        onConversationStart: () => {},
        onContent: (content) => {
          jsonHelperRequirements.feed(content);
        },
        onMessage: () => {},
        onDone: async () => {
          toast.success("生成需求完成");
          try {
            await checkConflictsAndDuplicates();
          } catch (e) {
            console.warn("冲突检查失败:", e);
          }
          resolve();
        },
        onError: (error) => {
          toast.error(error.message || "生成需求失败");
          reject(new Error(error.message || "生成需求失败"));
        },
      });
    });
  };

  const checkConflictsAndDuplicates = async () => {
    const unsavedRequirements = store.requirements.filter(
      (r) => !r.id || r.id.startsWith("rq_"),
    );

    if (unsavedRequirements.length === 0) {
      return;
    }

    const requirements = unsavedRequirements.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description || "",
    }));

    const response = await aiApi.checkRequirements({
      projectId: store.projectId,
      requirements,
    });

    store.setRequirementCheckResult(response);
    if (response.totalDuplicates > 0 || response.totalConflicts > 0) {
      toast.warning(
        `发现 ${response.totalDuplicates} 个重复，${response.totalConflicts} 个冲突`,
      );
    }
  };

  const generateTitle = async () => {
    try {
      const response = await rawRequirementsApi.generateTitle({
        content: store.rawRequirement.content,
      });
      if (response.title) {
        store.rawRequirement.title = response.title;
        toast.success("标题生成完成");
      } else {
        toast.error("生成标题失败");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "生成标题失败");
    }
  };

  const saveRequirement = async (
    requirement: AiGeneratedRequirementDto,
  ): Promise<boolean> => {
    try {
      const createDto: RequirementDto = {
        title: requirement.title,
        description: requirement.description,
        priority: requirement.priority,
        source: requirement.source,
        parentRequirementId: requirement.parentId || undefined,
        sourceRawRequirementId: store.rawRequirement.id || undefined,
        moduleIds: requirement.moduleId && requirement.moduleId !== "NEW"
          ? [requirement.moduleId]
          : undefined,
      };

      const result = await requirementsApi.create(createDto);
      store.updateRequirementId(requirement.id, result.id);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存需求失败");
      return false;
    }
  };

  const saveAllRequirements = async (): Promise<boolean> => {
    const unsavedRequirements = store.requirements.filter(
      (r) => !r.id || r.id.startsWith("rq_"),
    );

    if (unsavedRequirements.length === 0) {
      toast.warning("没有需要保存的需求");
      return false;
    }

    try {
      const dtos: RequirementDto[] = unsavedRequirements.map((req) => ({
        title: req.title,
        description: req.description,
        priority: req.priority,
        source: req.source,
        parentRequirementId: req.parentId || undefined,
        sourceRawRequirementId: store.rawRequirement.id || undefined,
        moduleIds: req.moduleId && req.moduleId !== "NEW"
          ? [req.moduleId]
          : undefined,
      }));

      const results = await requirementsApi.batchCreate(dtos);
      for (let i = 0; i < unsavedRequirements.length; i++) {
        if (results[i]) {
          store.updateRequirementId(unsavedRequirements[i].id, results[i].id);
        }
      }
      toast.success(`成功保存 ${unsavedRequirements.length} 个需求`);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "批量保存需求失败");
      return false;
    }
  };

  return {
    handleSuccess,
    handleError,
    save,
    rawRequirementAnalyze,
    generateRequirements,
    generateTitle,
    saveRequirement,
    saveAllRequirements,
    checkConflictsAndDuplicates,
  };
}
