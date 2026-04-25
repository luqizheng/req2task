import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { AiSubmitRequestDto } from "@req2task/dto";
import axios from "@/api/axios";
import { useAudioRecorder } from "./useAudioRecorder";
import { useFileUpload } from "./useFileUpload";
import { useSSEStream, type StreamCallbacks } from "./useSSEStream";

export interface UseAiSubmitOptions {
  url: string;
  uploadFile?: boolean;
  audit?: boolean;
  onSuccess?: (data: { request: AiSubmitRequestDto; response: any }) => void;
  onError?: (error: Error) => void;
  transRequest?: (data: AiSubmitRequestDto) => unknown;
  getRustfsIds?: () => string[];
}

export function useAiSubmit(options: UseAiSubmitOptions) {
  const message = ref("");
  const isSubmitting = ref(false);

  const {
    audioFile,
    isRecording,
    startRecording,
    stopRecording,
    handleAudioFileSelect,
    clearAudio,
  } = useAudioRecorder();

  const {
    uploadedFiles,
    handleAttachmentSelect,
    removeUploadedFile,
    getSuccessFileIds,
  } = useFileUpload({
    targetType: options.audit ? "raw_requirement" : "project",
  });

  const { submitStream } = useSSEStream({
    url: options.url,
    transRequest: options.transRequest,
  });

  const hasContent = computed(() => {
    return (
      message.value.trim() || audioFile.value || uploadedFiles.value.length > 0
    );
  });

  const canSubmit = computed(() => {
    return hasContent.value && !isSubmitting.value;
  });

  const reset = () => {
    message.value = "";
    audioFile.value = null;
    uploadedFiles.value = [];
    isRecording.value = false;
    isSubmitting.value = false;
  };

  const buildRequestBody = (): AiSubmitRequestDto => ({
    message: message.value.trim(),
    auditRustFSId: [],
    attachmentsRustFSId: [
      ...getSuccessFileIds(),
      ...(options.getRustfsIds?.() || []),
    ],
  });

  const submitStreamWithCallbacks = async (callbacks: StreamCallbacks) => {
    if (!canSubmit.value) return;
    isSubmitting.value = true;

    try {
      await submitStream(buildRequestBody(), callbacks);
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error("提交失败，请稍后重试");
      ElMessage.error(err.message);
      callbacks.onError?.({ type: "error", message: err.message });
    } finally {
      isSubmitting.value = false;
    }
  };

  const submit = async () => {
    if (!canSubmit.value) return;
    isSubmitting.value = true;

    try {
      const body = buildRequestBody();
      const response = await axios.post<any>(
        options.url,
        !options.transRequest ? body : options.transRequest(body),
      );

      ElMessage.success("提交成功");
      options.onSuccess?.({ request: body, response: response });
      reset();
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error("提交失败，请稍后重试");
      ElMessage.error(err.message);
      options.onError?.(err);
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    message,
    audioFile,
    uploadedFiles,
    isSubmitting,
    isRecording,
    hasContent,
    canSubmit,
    startRecording,
    stopRecording,
    handleAudioFileSelect,
    handleAttachmentSelect,
    removeUploadedFile,
    clearAudio,
    reset,
    submit,
    submitStream: submitStreamWithCallbacks,
  };
}

export type {
  SSEEvent,
  StreamCallbacks,
  AnalyzeStartEvent,
  ConversationStartEvent,
  ContentEvent,
  MessageEvent,
  DoneEvent,
  ErrorEvent,
} from "./useSSEStream";
export type { UploadedFile } from "./useFileUpload";
