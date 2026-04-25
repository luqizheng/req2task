import { ElMessage } from "element-plus";
import { useRawRequirementCreateStore, type AiQuestion } from "./store";
import type { CreateRawRequirementDto, UpdateRawRequirementDto } from "@req2task/dto";
import { AiSubmitRequestDto, GenerateRawRequirementByLLMDto } from "@req2task/dto";
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

    store.rawRequirement.content = request.message;

    //   if (response?.id) {

    //     const result = response as RawRequirementResponseDto;
    //     store.setRawRequirement(result);
    //     if (result.questionAndAnswers && result.questionAndAnswers.length > 0) {
    //       ElMessage.success("需求已录入，发现追问问题");
    //     } else {
    //       ElMessage.success("需求已录入");
    //     }
    //   } else if ((data as { questions?: AiQuestion[] })?.questions) {
    //     const sseData = data as {
    //       keyElements?: string[];
    //       questions?: AiQuestion[];
    //     };
    //     store.setQuestionsFromSSE(null, sseData);
    //     ElMessage.success("需求已录入，发现追问问题");
    //   }
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
    if (
      store.isReanalyze &&
      store.rawRequirement.questionAndAnswers.length > 0
    ) {
      dto.previousQuestions = store.rawRequirement.questionAndAnswers.filter(
        (qa) => qa.answer,
      );
    }
    
    return dto;
  };

  const jsonHelper = useJsonStream([
    {
      trigger: "questions",
      onArrayItem(item) {
        store.addQuestionFromSSE(item as AiQuestion);
      },
    },
  ]);

  const handleData = (data: string) => {
    jsonHelper.feed(data);
  };

  const create = async (projectId: string): Promise<boolean> => {
    const dto: CreateRawRequirementDto = {
      content: store.rawRequirement.content,
      source: store.rawRequirement.source || undefined,
      collectionType: store.rawRequirement.collectionType,
      collectTime: store.rawRequirement.collectTime || undefined,
    };

    try {
      const result = await rawRequirementsApi.create(projectId, dto);
      if (result.data) {
        store.setRawRequirement(result.data);
        ElMessage.success("创建成功");
        return true;
      }
      return false;
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : "创建失败");
      return false;
    }
  };

  const update = async (): Promise<boolean> => {
    if (!store.rawRequirement.id) {
      ElMessage.warning("需求ID不存在");
      return false;
    }

    const dto: UpdateRawRequirementDto = {
      questionAndAnswers: store.rawRequirement.questionAndAnswers,
      keyElements: store.rawRequirement.keyElements,
    };

    try {
      const result = await rawRequirementsApi.update(
        store.rawRequirement.id,
        dto,
      );
      if (result.data) {
        store.setRawRequirement(result.data);
        ElMessage.success("更新成功");
        return true;
      }
      return false;
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : "更新失败");
      return false;
    }
  };

  return {
    handleSuccess,
    handleError,
    translRequestData,
    handleData,
    create,
    update,
  };
}
