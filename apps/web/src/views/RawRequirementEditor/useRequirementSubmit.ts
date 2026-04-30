import { toast } from 'vue-sonner';
import { useRawRequirementCreateStore, type AiQuestion } from "./store";

import {
  AiSubmitRequestDto,
  GenerateRawRequirementByLLMDto,
} from "@req2task/dto";
import { useJsonStream } from "../../utils/useJson";
import { rawRequirementsApi } from "@/api/rawRequirements";
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
        console.log('questions',item)
        debugger;
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
        content: store.rawRequirement.content,
        source: store.rawRequirement.source || undefined,
        collectionType: store.rawRequirement.collectionType,
        collectTime: store.rawRequirement.collectTime || undefined,
        fileIds: store.rawRequirement.fileIds,
      };

      const result = !store.rawRequirement.id
        ? await rawRequirementsApi.create(store.projectId, requirementDto)
        : await rawRequirementsApi.update(store.rawRequirement.id, {
            questionAndAnswers: store.rawRequirement.questionAndAnswers,
            keyElements: store.rawRequirement.keyElements,
          });

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

  let a = "";
  const rawRequirementAnalyze = () => {
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
      },
      onError: (error) => {
        toast.error(error.message || "分析失败");
      },
    });
  };

  const generateRequirements = () => {
    const data = {
      rawRequirementId: store.rawRequirement.id,
    };
    sseGenerateRequirementsStream.submitStream(data, {
      onAnalyzeStart: (event) => {
        store.rawRequirement.conversationId = event.collectionId;
      },
      onConversationStart: () => {},
      onContent: (content) => {
        a += content;
        jsonHelperRequirements.feed(content);
      },
      onMessage: () => {},
      onDone: () => {
        toast.success("生成需求完成");
      },
      onError: (error) => {
        toast.error(error.message || "生成需求失败");
      },
    });
  };

  return {
    handleSuccess,
    handleError,
    save,
    rawRequirementAnalyze,
    generateRequirements,
  };
}
