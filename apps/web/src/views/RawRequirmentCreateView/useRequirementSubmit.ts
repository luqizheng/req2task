import { ElMessage } from "element-plus";
import { useRawRequirementCreateStore, type AiQuestion } from "./store";
import type { RawRequirementResponseDto } from "@req2task/dto";
import { AiSubmitRequestDto, GenerateRawRequirementDto } from "@req2task/dto";
import { useJsonStream } from "@/utils/useJson";

export function useRequirementSubmit(
  store: ReturnType<typeof useRawRequirementCreateStore>,
) {
  const handleSuccess = (data: { request: AiSubmitRequestDto; response: string }) => {
    const { request, response } = data;
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
  ): GenerateRawRequirementDto => {
    const dto: GenerateRawRequirementDto = {
      conversationText: data.message.trim(),
    };
    const source = store.rawRequirement.source?.trim();
    if (source) {
      dto.source = source;
    }
    if (store.rawRequirement.collectionType) {
      dto.collectionType = store.rawRequirement.collectionType;
    }
    if (store.rawRequirement.collectTime) {
      dto.collectTime = store.rawRequirement.collectTime;
    }
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

  return {
    handleSuccess,
    handleError,
    translRequestData,
    handleData,
  };
}
