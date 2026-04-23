import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { attachmentApi } from "@/api/attachment";
import { AiSubmitRequestDto } from "@req2task/dto";
import axios from "@/api/axios";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "success" | "error";
  progress: number;
}

export interface AnalyzeStartEvent {
  type: "analyze_start";
  collectionId: string;
  prompts?: { systemPrompt: string; userPrompt: string };
  requirementFiles?: Array<{ type: string; data: string; name?: string }>;
  projectAttachments?: Array<{ type: string; data: string; name?: string }>;
}

export interface ConversationStartEvent {
  type: "conversation_start";
  conversationId: string;
  isNewConversation?: boolean;
}

export interface ContentEvent {
  type: "content";
  content: string;
}

export interface MessageEvent {
  type: "message";
  message: {
    id: string;
    conversationId: string;
    role: string;
    content: string;
    createdAt: string;
  };
}

export interface AiQuestion {
  question: string;
  purpose?: string;
}

export interface DoneEvent {
  type: "done";
  followUpQuestions?: string[];
  keyElements?: string[];
  questions?: AiQuestion[];
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export type SSEEvent =
  | AnalyzeStartEvent
  | ConversationStartEvent
  | ContentEvent
  | MessageEvent
  | DoneEvent
  | ErrorEvent;

export interface UseAiSubmitOptions {
  url: string;
  uploadFile?: boolean;
  audit?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
  transRequest?: (data: AiSubmitRequestDto) => unknown;
}

export interface StreamCallbacks {
  onAnalyzeStart?: (event: AnalyzeStartEvent) => void;
  onConversationStart?: (event: ConversationStartEvent) => void;
  onContent?: (content: string) => void;
  onMessage?: (event: MessageEvent) => void;
  onDone?: (event: DoneEvent) => void;
  onError?: (error: ErrorEvent) => void;
}

export function useAiSubmit(options: UseAiSubmitOptions) {
  const message = ref("");
  const audioFile = ref<File | null>(null);
  const uploadedFiles = ref<UploadedFile[]>([]);
  const isSubmitting = ref(false);
  const isRecording = ref(false);

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];

  const hasContent = computed(() => {
    return (
      message.value.trim() || audioFile.value || uploadedFiles.value.length > 0
    );
  });

  const canSubmit = computed(() => {
    return hasContent.value && !isSubmitting.value;
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        const fileName = `recording_${Date.now()}.webm`;
        audioFile.value = new File([blob], fileName, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        ElMessage.success("录音完成");
      };

      mediaRecorder.start();
      isRecording.value = true;
      ElMessage.info("开始录音...");
    } catch (error) {
      ElMessage.error("无法访问麦克风，请检查权限设置");
      console.error("Recording error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording.value) {
      mediaRecorder.stop();
      isRecording.value = false;
    }
  };

  const handleAudioFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      audioFile.value = file;
    }
    target.value = "";
  };

  const handleAttachmentSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);

    files.forEach((file) => {
      const uploadedFile: UploadedFile = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
        progress: 0,
      };
      uploadedFiles.value = [...uploadedFiles.value, uploadedFile];
      uploadFile(file, uploadedFile.id);
    });

    target.value = "";
  };

  const uploadFile = async (file: File, tempId: string) => {
    try {
      const response = await attachmentApi.upload({
        file,
        targetType: options.audit ? "raw_requirement" : "project",
      });

      const index = uploadedFiles.value.findIndex((f) => f.id === tempId);
      if (index !== -1) {
        uploadedFiles.value = uploadedFiles.value.map((f, i) =>
          i === index
            ? {
                ...f,
                id: response.id,
                status: "success" as const,
                progress: 100,
              }
            : f,
        );
      }
    } catch (error) {
      const index = uploadedFiles.value.findIndex((f) => f.id === tempId);
      if (index !== -1) {
        uploadedFiles.value = uploadedFiles.value.map((f, i) =>
          i === index ? { ...f, status: "error" as const } : f,
        );
      }
      ElMessage.error(`${file.name} 上传失败，请重试`);
    }
  };

  const removeUploadedFile = (id: string) => {
    uploadedFiles.value = uploadedFiles.value.filter((f) => f.id !== id);
  };

  const clearAudio = () => {
    audioFile.value = null;
  };

  const reset = () => {
    message.value = "";
    audioFile.value = null;
    uploadedFiles.value = [];
    isRecording.value = false;
    isSubmitting.value = false;
  };

  const parseSSEEvent = (data: string): SSEEvent | null => {
    try {
      return JSON.parse(data) as SSEEvent;
    } catch {
      return null;
    }
  };

  const handleSSEEvent = (event: SSEEvent, callbacks: StreamCallbacks) => {
    switch (event.type) {
      case "analyze_start":
        callbacks.onAnalyzeStart?.(event);
        break;
      case "conversation_start":
        callbacks.onConversationStart?.(event);
        break;
      case "content":
        callbacks.onContent?.(event.content);
        break;
      case "message":
        callbacks.onMessage?.(event);
        break;
      case "done":
        callbacks.onDone?.(event);
        break;
      case "error":
        callbacks.onError?.(event);
        break;
    }
  };

  const submitStream = async (callbacks: StreamCallbacks) => {
    if (!canSubmit.value) return;

    isSubmitting.value = true;

    try {
      const body: AiSubmitRequestDto = {
        message: message.value.trim(),
        auditRustFSId: [],
        attachmentsRustFSId: uploadedFiles.value
          .filter((f) => f.status === "success" && !f.id.startsWith("temp_"))
          .map((f) => f.id),
      };

      const token = localStorage.getItem("accessToken");
      const requestBody = !options.transRequest
        ? JSON.stringify(body)
        : JSON.stringify(options.transRequest(body));
      console.log("[submitStream] 请求 URL:", options.url);
      console.log("[submitStream] 请求 Body:", requestBody);
      console.log("[submitStream] Token:", token ? "存在" : "不存在");

      const response = await fetch(options.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: requestBody,
      });

      console.log("[submitStream] 响应状态:", response.status);
      console.log("[submitStream] 响应状态文本:", response.statusText);

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法读取响应流");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        console.log("[submitStream] 开始读取流...");
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("[submitStream] 流读取完成");
            break;
          }

          console.log("[submitStream] 收到数据块:", value);
          buffer += decoder.decode(value, { stream: true });
          console.log("[submitStream] buffer:", buffer);
          const lines = buffer.split("\n");

          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              console.log("[submitStream] 解析到的数据:", data);
              if (data === "[DONE]") {
                console.log("[submitStream] 收到完成标记");
                callbacks.onDone?.({ type: "done" });
                return;
              }

              const event = parseSSEEvent(data);
              console.log("[submitStream] 解析后的事件:", event);
              if (event) {
                handleSSEEvent(event, callbacks);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
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
      const formData: AiSubmitRequestDto = {
        message: message.value.trim(),
        auditRustFSId: [],
        attachmentsRustFSId: uploadedFiles.value
          .filter((f) => f.status === "success" && !f.id.startsWith("temp_"))
          .map((f) => f.id),
      };

      const response = await axios.post(
        options.url,
        !options.transRequest ? formData : options.transRequest(formData),
      );


      console.log(response)
      
   
      const data = response;
      ElMessage.success("提交成功");
      options.onSuccess?.(data);
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
    submitStream,
  };
}
