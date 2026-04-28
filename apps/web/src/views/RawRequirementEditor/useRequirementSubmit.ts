import { ElMessage } from "element-plus";
import { useRawRequirementCreateStore, type AiQuestion } from "./store";

import {
  AiSubmitRequestDto,
  GenerateRawRequirementByLLMDto,
} from "@req2task/dto";
import { useJsonStream } from "@/utils/useJson";
import { rawRequirementsApi } from "@/api/rawRequirements";
import { useSSEStream } from "@/utils/useSSEStream";

export function useRequirementSubmit(
  store: ReturnType<typeof useRawRequirementCreateStore>,
) {
  const sseStream = useSSEStream({
    url: `/api/raw-requirements/${store.projectId}/stream`,
  });

  const handleSuccess = (data: {
    request: AiSubmitRequestDto;
    response: string;
  }) => {
    const { request } = data;
    if (!data) {
      ElMessage.warning("未收到有效数据");
      return;
    }

    store.rawRequirement.content = [
      store.rawRequirement.content ?? "",
      request.message,
    ].join("\n");
  };

  const handleError = (error: Error) => {
    ElMessage.error(error.message || "提交失败");
  };

  const translRequestData = (
    data: AiSubmitRequestDto,
  ): GenerateRawRequirementByLLMDto => {
    const dto: GenerateRawRequirementByLLMDto = {
      conversationText: [data.message, data.message.trim()].join("\n"),
    };

    dto.previousQuestions = store.rawRequirement.questionAndAnswers.filter(
      (qa) => qa.answer,
    );

    return dto;
  };

  const jsonHelper = useJsonStream([
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
          ElMessage.success("创建成功");
          store.rawRequirement.id = result.id;
        } else {
          ElMessage.success("更新成功");
        }

        return true;
      }
      return false;
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : "创建失败");
      return false;
    }
  };

  const rawRequirementAnalyze = () => {
    const analyzerData = {
      conversationText: store.rawRequirement.content,
      previousQuestions: store.rawRequirement.questionAndAnswers,
    } as GenerateRawRequirementByLLMDto;

    sseStream.submitStream(analyzerData, {
      onAnalyzeStart: (event) => {
        store.rawRequirement.conversationId = event.collectionId;
        console.log("开始分析...");
      },
      onConversationStart: (cc) => {
        console.log("开始对话...", cc);
      },
      onContent: (content) => {
        jsonHelper.feed(content);
      },
      onMessage: (message) => {
        //console.log("sse", message);
      },
      onDone: () => {
        ElMessage.success("分析完成");
      },
      onError: (error) => {
        ElMessage.error(error.message || "分析失败");
      },
    });
  };

  return {
    handleSuccess,
    handleError,
    translRequestData,
    save,
    rawRequirementAnalyze,
  };
}
