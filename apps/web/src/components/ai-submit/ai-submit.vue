<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import {
  Microphone,
  Upload,
  Paperclip,
  Close,
  Promotion,
} from "@element-plus/icons-vue";
import {
  useAiSubmit,
  type AnalyzeStartEvent,
  type ConversationStartEvent,
  type MessageEvent,
  type DoneEvent,
  type ErrorEvent,
} from "./composables/useAiSubmit";
import { useRustFS } from "@/composables/useRustFS";
import { AiSubmitRequestDto } from "@req2task/dto";
import SseOutput from "./sse-output.vue";

interface Props {
  url: string;
  uploadFile?: boolean;
  audit?: boolean;
  placeholder?: string;
  useStream?: boolean;
  transRequest?: (data: AiSubmitRequestDto) => unknown;
  targetType?: "collection" | "raw_requirement" | "project";
  targetId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  uploadFile: false,
  audit: false,
  placeholder: "描述您的需求或问题，AI 将为您分析和处理...",
  useStream: true,
  targetType: "project",
});

const emit = defineEmits<{
  (e: "success", data: unknown): void;
  (e: "error", error: Error): void;
  (e: "analyzeStart", event: AnalyzeStartEvent): void;
  (e: "conversationStart", event: ConversationStartEvent): void;
  (e: "content", content: string): void;
  (e: "message", event: MessageEvent): void;
  (e: "done", event: DoneEvent): void;
  (e: "streamError", error: ErrorEvent): void;
  (e: "uploadSuccess", attachmentIds: string[]): void;
}>();

const {
  message,
  audioFile,
  uploadedFiles,
  isSubmitting,
  isRecording,
  canSubmit,
  startRecording,
  stopRecording,
  handleAudioFileSelect,
  removeUploadedFile,
  clearAudio,
  reset,
  submit,
} = useAiSubmit({
  url: props.url,
  uploadFile: props.uploadFile,
  audit: props.audit,
  onSuccess: (data) => emit("success", data),
  onError: (error) => emit("error", error),
  transRequest: props.transRequest,
});

const { upload: rustfsUpload, uploadingFiles, removeFile, clearFiles } = useRustFS();

const audioInputRef = ref<HTMLInputElement | null>(null);
const attachmentInputRef = ref<HTMLInputElement | null>(null);
const sseOutputRef = ref<InstanceType<typeof SseOutput> | null>(null);

const showSseOutput = ref(false);
const conversationId = ref<string | undefined>();
const isNewConversation = ref(false);

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const rustfsFiles = computed(() => {
  return Array.from(uploadingFiles.value.values());
});

const allUploadedFiles = computed(() => {
  return [...uploadedFiles.value, ...rustfsFiles.value];
});

const handleRecordClick = () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording();
  }
};

const triggerAudioSelect = () => {
  audioInputRef.value?.click();
};

const triggerAttachmentSelect = () => {
  attachmentInputRef.value?.click();
};

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files || []);

  for (const file of files) {
    try {
      await rustfsUpload(file, props.targetType, props.targetId);
    } catch (error) {
      ElMessage.error(`${file.name} 上传失败`);
    }
  }

  target.value = "";
};

const handleCancel = () => {
  reset();
  clearFiles();
  hideOutput();
};

const hideOutput = () => {
  showSseOutput.value = false;
  sseOutputRef.value?.reset();
  conversationId.value = undefined;
  isNewConversation.value = false;
};

const handleSubmit = () => {
  if (props.useStream) {
    submitStream();
  } else {
    submit();
  }
};

const submitStream = async () => {
  if (!canSubmit.value) return;

  showSseOutput.value = true;
  sseOutputRef.value?.reset();

  const rustfsIds = rustfsFiles.value
    .filter((f) => f.status === "success" && !f.id.startsWith("temp_"))
    .map((f) => f.id);
  if (rustfsIds.length > 0) {
    emit("uploadSuccess", rustfsIds);
  }

  const body: AiSubmitRequestDto = {
    message: message.value.trim(),
    auditRustFSId: [],
    attachmentsRustFSId: uploadedFiles.value
      .filter((f) => f.status === "success" && !f.id.startsWith("temp_"))
      .map((f) => f.id),
  };

  const token = localStorage.getItem("accessToken");

  try {
    const response = await fetch(props.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: !props.transRequest
        ? JSON.stringify(body)
        : JSON.stringify(props.transRequest(body)),
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
            emit("done", { type: "done" });
            break;
          }

          try {
            const event = JSON.parse(data);

            switch (event.type) {
              case "conversation_start":
                conversationId.value = event.conversationId;
                isNewConversation.value = event.isNewConversation;
                sseOutputRef.value?.handleConversationStart(event);
                emit("conversationStart", event);
                break;
              case "content":
                if (event.content) {
                  sseOutputRef.value?.handleContent(event.content);
                  emit("content", event.content);
                }
                break;
              case "message":
                if (event.message?.content) {
                  sseOutputRef.value?.handleMessage(event.message.content);
                }
                emit("message", event);
                break;
              case "done":
                sseOutputRef.value?.handleDone(event);
                emit("done", event);
                break;
              case "error":
                sseOutputRef.value?.handleError(event);
                emit("streamError", event);
                break;
            }
          } catch {
            console.warn("Failed to parse SSE event:", data);
          }
        }
      }
    }

    reset();
    clearFiles();
  } catch (error) {
    const err =
      error instanceof Error ? error : new Error("提交失败，请稍后重试");
    ElMessage.error(err.message);
    sseOutputRef.value?.handleError({
      type: "error",
      message: err.message,
    });
    emit("streamError", {
      type: "error",
      message: err.message,
    });
  }
};
</script>

<template>
  <div class="ai-submit-container">
    <SseOutput
      v-if="showSseOutput"
      ref="sseOutputRef"
      :conversation-id="conversationId"
      :is-new-conversation="isNewConversation"
    />

    <div class="ai-submit" :class="{ 'with-output': showSseOutput }">
      <div class="input-section">
        <el-input
          v-model="message"
          type="textarea"
          :rows="3"
          :placeholder="placeholder"
          resize="none"
          :disabled="isSubmitting"
        />
      </div>

      <div class="toolbar">
        <div class="toolbar-left">
          <el-button
            :type="isRecording ? 'danger' : 'default'"
            :icon="isRecording ? Close : Microphone"
            size="small"
            :disabled="isSubmitting || !!audioFile"
            @click="handleRecordClick"
          >
            {{ isRecording ? "停止" : "录音" }}
          </el-button>

          <el-button
            text
            size="small"
            :disabled="isSubmitting || !!audioFile || isRecording"
            @click="triggerAudioSelect"
          >
            <el-icon class="tool-icon">
              <Upload />
            </el-icon>
            上传音频
          </el-button>

          <el-button
            v-if="uploadFile"
            text
            size="small"
            :disabled="isSubmitting"
            @click="triggerAttachmentSelect"
          >
            <el-icon class="tool-icon">
              <Paperclip />
            </el-icon>
            上传附件
          </el-button>
        </div>

        <div class="toolbar-right">
          <el-switch
            v-model="useStream"
            active-text="流式"
            inactive-text="普通"
            inline-prompt
            style="--el-switch-on-color: #6366f1"
          />
        </div>
      </div>

      <div v-if="audioFile" class="audio-preview">
        <div class="file-item">
          <div class="file-icon">
            <el-icon :size="20">
              <Microphone />
            </el-icon>
          </div>
          <div class="file-info">
            <div class="file-name">{{ audioFile.name }}</div>
            <div class="file-meta">
              <span class="file-size">{{ formatSize(audioFile.size) }}</span>
              <span class="file-type">音频</span>
            </div>
          </div>
          <el-icon class="remove-icon" @click="clearAudio">
            <Close />
          </el-icon>
        </div>
      </div>

      <div v-if="allUploadedFiles.length > 0" class="attachment-list">
        <div
          v-for="file in allUploadedFiles"
          :key="file.id"
          :class="['file-item', file.status]"
        >
          <div class="file-icon">
            <el-icon :size="20">
              <Paperclip />
            </el-icon>
          </div>
          <div class="file-info">
            <div class="file-name">{{ file.name }}</div>
            <div class="file-meta">
              <span class="file-size">{{ formatSize(file.size) }}</span>
              <span class="file-type">附件</span>
            </div>
            <el-progress
              v-if="file.status === 'uploading'"
              :percentage="file.progress"
              :show-text="false"
              :stroke-width="2"
            />
          </div>
          <el-icon
            v-if="file.status !== 'uploading'"
            class="remove-icon"
            @click="
              file.id.startsWith('temp_')
                ? removeFile(file.id)
                : removeUploadedFile(file.id)
            "
          >
            <Close />
          </el-icon>
          <el-icon v-else class="loading-icon">
            <Upload />
          </el-icon>
        </div>
      </div>

      <div class="actions">
        <el-button size="default" @click="handleCancel" :disabled="isSubmitting">
          取消
        </el-button>
        <el-button
          type="primary"
          :icon="Promotion"
          :disabled="!canSubmit"
          :loading="isSubmitting"
          @click="handleSubmit"
        >
          {{ useStream ? "流式提交" : "提交" }}
        </el-button>
      </div>
    </div>

    <input
      ref="audioInputRef"
      type="file"
      accept="audio/*"
      class="hidden-input"
      @change="handleAudioFileSelect"
    />
    <input
      ref="attachmentInputRef"
      type="file"
      multiple
      accept=".pdf,.docx,.doc,.xlsx,.xls,.txt"
      class="hidden-input"
      @change="handleFileSelect"
    />
  </div>
</template>

<style scoped>
.ai-submit-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-submit {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5ff 100%);
  border-radius: 12px;
  border: 1px solid #e8e5ff;
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.08);
}

.ai-submit.with-output {
  border-radius: 12px 12px 0 0;
}

.input-section :deep(.el-textarea__inner) {
  border: none;
  padding: 0;
  font-size: 14px;
  background: transparent;
}

.input-section :deep(.el-textarea__inner:focus) {
  box-shadow: none;
  background: rgba(255, 255, 255, 0.9);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid rgba(99, 102, 241, 0.12);
  border-bottom: 1px solid rgba(99, 102, 241, 0.12);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.tool-icon {
  margin-right: 4px;
  color: #6366f1;
}

.audio-preview,
.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  border: 1px solid rgba(99, 102, 241, 0.15);
  transition: all 0.2s ease;
}

.file-item:hover {
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.file-item.success {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
}

.file-item.error {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.file-item.uploading {
  border-color: #6366f1;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
}

.file-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 10px;
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.file-item.success .file-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.file-item.error .file-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.file-type {
  padding: 2px 8px;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  border-radius: 4px;
  font-weight: 500;
}

.file-item.success .file-type {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.file-item.error .file-type {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.remove-icon {
  flex-shrink: 0;
  cursor: pointer;
  color: #94a3b8;
  font-size: 16px;
  transition: all 0.2s;
  padding: 4px;
  border-radius: 4px;
}

.remove-icon:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.loading-icon {
  flex-shrink: 0;
  color: #6366f1;
  font-size: 16px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

.hidden-input {
  display: none;
}
</style>
