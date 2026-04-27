<script setup lang="ts">
import { ref, watch } from "vue";
import { AiSubmit } from "@/components/ai-submit";
import type { AiSubmitRequestDto } from "@req2task/dto";

interface Props {
  projectId: string;
  messageHistory: Array<{ role: "user"; content: string }>;
  onSuccess: (...args: any[]) => void;
  onError: (...args: any[]) => void;
  onContent: (...args: any[]) => void;
  translRequestData: (data: AiSubmitRequestDto) => any;
}

const props = withDefaults(defineProps<Props>(), {
  messageHistory: () => []
});

const aiSubmitRef = ref<InstanceType<typeof AiSubmit> | null>(null);

const submitStream = () => {
  aiSubmitRef.value?.submitStream();
};

watch(
  () => props.messageHistory,
  () => {
    aiSubmitRef.value?.setMessageHistory(props.messageHistory || []);
  },
  { immediate: true }
);

// 暴露方法给父组件
defineExpose({
  submitStream
});
</script>

<template>
  <AiSubmit
    ref="aiSubmitRef"
    :url="`/api/raw-requirements/${projectId}/stream`"
    :upload-file="true"
    :use-stream="true"
    message-key="conversationText"
    placeholder="描述您的需求或问题，AI 将为您分析和处理..."
    @success="onSuccess"
    @error="onError"
    :trans-request="translRequestData"
    @content="onContent"
    mode="input-only"
  />
</template>
