import { ElMessage } from "element-plus";
import { useRawRequirementCreateStore } from "./store";
import { AiSubmitRequestDto, GenerateRawRequirementByLLMDto } from "@req2task/dto";
import { useJsonStream } from "@/utils/useJson";
import type { AiQuestion } from "./store";

export function useReanalyze(
  store: ReturnType<typeof useRawRequirementCreateStore>,
  projectId: string,
) {
  const jsonHelper = useJsonStream([
    {
      trigger: "questions",
      onArrayItem(item) {
        store.addQuestionFromSSE(item as AiQuestion);
      },
    },
  ]);

  const handleReanalyze = async () => {
    if (!store.rawRequirement.content) {
      ElMessage.error("缺少原始需求内容");
      return;
    }

    const source = store.rawRequirement.source?.trim();
    if (!source) {
      ElMessage.error("请填写需求来源");
      return;
    }

    store.setIsReanalyze(true);
    store.setIsGenerating(true);

    try {
      const body: AiSubmitRequestDto = {
        message: store.rawRequirement.content,
        auditRustFSId: [],
        attachmentsRustFSId: [],
      };

      const dto: GenerateRawRequirementByLLMDto = {
        conversationText: body.message.trim(),
        source: store.rawRequirement.source,
        collectionType: store.rawRequirement.collectionType,
        collectTime: store.rawRequirement.collectTime || undefined,
        previousQuestions: store.rawRequirement.questionAndAnswers.filter(qa => qa.answer),
      };

      const token = localStorage.getItem("accessToken");

      const response = await fetch(`/api/raw-requirements/${projectId}/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法读取响应流");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              ElMessage.success("再次分析完成");
              break;
            }

            try {
              const event = JSON.parse(data);

              switch (event.type) {
                case "done":
                  if (event.keyElements || event.questions) {
                    store.setQuestionsFromSSE(null, {
                      keyElements: event.keyElements,
                      questions: event.questions || event.followUpQuestions?.map((q: string) => ({ question: q })) || [],
                    });
                  }
                  ElMessage.success("再次分析完成");
                  break;
                case "error":
                  throw new Error(event.message || "再次分析失败");
              }
            } catch (parseError) {
              jsonHelper.feed(data);
            }
          }
        }
      }
    } catch (error) {
      ElMessage.error((error as Error).message || "再次分析失败");
    } finally {
      store.setIsGenerating(false);
      store.setIsReanalyze(false);
    }
  };

  return {
    handleReanalyze,
  };
}
