import { ElMessage } from "element-plus";
import { useRawRequirementCreateStore, type AiQuestion } from "./store";

import {
  AiSubmitRequestDto,
  GenerateRawRequirementByLLMDto,

} from "@req2task/dto";
import { useJsonStream } from "@/utils/useJson";
import { rawRequirementsApi } from "@/api/rawRequirements";

export function useRequirementSubmit(
  store: ReturnType<typeof useRawRequirementCreateStore>,
) {
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
        if(!store.rawRequirement.keyElements)
          store.rawRequirement.keyElements=[];
        store.rawRequirement.keyElements.push(item);
      },
    },
  ]);

  const handleSSEData = (data: string) => {
    jsonHelper.feed(data);
  };

  const save = async (): Promise<boolean> => {
    try {
      const requirementDto = {
        content: store.rawRequirement.content,
        source: store.rawRequirement.source || undefined,
        collectionType: store.rawRequirement.collectionType,
        collectTime: store.rawRequirement.collectTime || undefined,
        fileIds: store.rawRequirement.fileIds
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

  return {
    handleSuccess,
    handleError,
    translRequestData,
    handleSSEData,
    save,
  };
}
