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
  type DoneEvent,
  type ErrorEvent,
} from "./composables/useAiSubmit";
import { useRustFS } from "@/composables/useRustFS";
import { AiSubmitRequestDto } from "@req2task/dto";
import SseOutput from "./sse-output.vue";
import "./ai-submit.css";

interface Props {
  url: string;
  uploadFile?: boolean;
  audit?: boolean;
  placeholder?: string;
  useStream?: boolean;
  transRequest?: (data: AiSubmitRequestDto) => unknown;
  targetType?: "collection" | "raw_requirement" | "project";
  targetId?: string;
  mode?: "full" | "input-only";
}

const props = withDefaults(defineProps<Props>(), {
  uploadFile: false,
  audit: false,
  placeholder: "描述您的需求或问题，AI 将为您分析和处理...",
  useStream: true,
  targetType: "project",
  mode: "full",
});

const emit = defineEmits<{
  (e: "success", data: { request: AiSubmitRequestDto; response: any }): void;
  (e: "error", error: Error): void;
  (e: "analyzeStart", event: AnalyzeStartEvent): void;
  (e: "conversationStart", event: ConversationStartEvent): void;
  (e: "content", content: string): void;
  (e: "message", response: string): void;
  (e: "done", event: DoneEvent): void;
  (e: "streamError", error: ErrorEvent): void;
  (e: "uploadSuccess", attachmentIds: string[]): void;
  (e: "update:useStream", value: boolean): void;
}>();

const {
  upload: rustfsUpload,
  uploadingFiles,
  removeFile,
  clearFiles,
} = useRustFS();

const rustfsFiles = computed(() => {
  return Array.from(uploadingFiles.value.values());
});

const getSuccessRustfsIds = () =>
  rustfsFiles.value
    .filter((f) => f.status === "success" && !f.id.startsWith("temp_"))
    .map((f) => f.id);

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
  submitStream: submitStreamBase,
} = useAiSubmit({
  url: props.url,
  uploadFile: props.uploadFile,
  audit: props.audit,
  onSuccess: (data) => emit("success", data),
  onError: (error) => emit("error", error),
  transRequest: props.transRequest,
  getRustfsIds: getSuccessRustfsIds,
  hasExternalContent: () => rustfsFiles.value.length > 0,
});

const audioInputRef = ref<HTMLInputElement | null>(null);
const attachmentInputRef = ref<HTMLInputElement | null>(null);
const sseOutputRef = ref<InstanceType<typeof SseOutput> | null>(null);

const showSseOutput = ref(false);
const conversationId = ref<string | undefined>();
const isNewConversation = ref(false);
const localUseStream = ref(props.useStream);
const submittedMessage = ref("");
const isStreaming = ref(false);
const messageHistory = ref<Array<{ role: "user"; content: string }>>([]);

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

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
  messageHistory.value = [];
};

const handleSubmit = () => {

  if (localUseStream.value) {
    submitStream();
  } else {
    submit();
  }
};

const setMessageHistory = (history: Array<{ role: "user"; content: string }>) => {
  showSseOutput.value=true;
  messageHistory.value = history;
};

const submitStream = async () => {
  if (!canSubmit.value) return;

  const userMessage = message.value.trim();
  submittedMessage.value = userMessage;
  messageHistory.value.push({ role: "user", content: userMessage });


  showSseOutput.value = true;
  isStreaming.value = true;
  sseOutputRef.value?.reset();

  const rustfsIds = getSuccessRustfsIds();
  if (rustfsIds.length > 0) {
    emit("uploadSuccess", rustfsIds);
  }

  let fullContent = "";

  await submitStreamBase(
    {
      onConversationStart: (event) => {
        conversationId.value = event.conversationId;
        isNewConversation.value = event.isNewConversation ?? false;
        sseOutputRef.value?.handleConversationStart(event);
        emit("conversationStart", event);
      },
      onContent: (content) => {
        fullContent += content;
        sseOutputRef.value?.handleContent(content);
        emit("content", content);
      },
      onMessage: (event) => {
        if (event.message?.content) {
          sseOutputRef.value?.handleMessage(event.message.content);
        }
        emit("message", event.message?.content);
      },
      onDone: (event) => {
        sseOutputRef.value?.handleDone(event);
        emit("done", event);
        emit("success", {
          request: {
            message: userMessage,
            auditRustFSId: [],
            attachmentsRustFSId: rustfsIds,
          },
          response: fullContent,
        });
        isStreaming.value = false;
        reset();
        clearFiles();
      },
      onError: (error) => {
        sseOutputRef.value?.handleError(error);
        emit("streamError", error);
        isStreaming.value = false;
      },
    },
    userMessage,
  );
};

defineExpose({
  submitStream,
  handleCancel,
  setMessageHistory,
});
</script>

<template>
  <div class="ai-submit-container">
    <SseOutput
      v-if="showSseOutput && props.mode === 'full'"
      ref="sseOutputRef"
      :conversation-id="conversationId"
      :is-new-conversation="isNewConversation"
    />

    <div
      v-if="showSseOutput && props.mode === 'input-only'"
      class="message-history-box"
    >
      <div
        v-for="(msg, index) in messageHistory"
        :key="index"
        class="history-item"
      >
        <div class="history-content">{{ msg.content }}</div>
        <div
          v-if="isStreaming && index === messageHistory.length - 1"
          class="loading-indicator"
        >
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
        </div>
      </div>
    </div>

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
        <slot name="actions">
          <!-- <el-button
            size="default"
            @click="handleCancel"
            :disabled="isSubmitting"
          >
            取消
          </el-button> -->
          <el-button
            type="primary"
            :icon="Promotion"
            :disabled="!canSubmit || isStreaming"
            :loading="isSubmitting || isStreaming"
            @click="handleSubmit"
          >
            {{ localUseStream ? "流式提交" : "提交" }}
          </el-button>
        </slot>
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
