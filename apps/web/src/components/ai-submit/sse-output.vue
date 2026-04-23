<script setup lang="ts">
import { ref, onMounted } from "vue";
import type {
  ConversationStartEvent,
  DoneEvent,
  ErrorEvent,
} from "./composables/useAiSubmit";

interface Props {
  conversationId?: string;
  isNewConversation?: boolean;
  speed?: number;
}

const props = withDefaults(defineProps<Props>(), {
  speed: 30,
});

const emit = defineEmits<{
  (e: "mounted"): void;
}>();

const content = ref("");
const displayedContent = ref("");
const isTyping = ref(false);
const isComplete = ref(false);
const error = ref<string | null>(null);
const followUpQuestions = ref<string[]>([]);
const keyElements = ref<string[]>([]);

let typingInterval: ReturnType<typeof setInterval> | null = null;
let currentIndex = 0;

const startTyping = () => {
  if (typingInterval) {
    clearInterval(typingInterval);
  }

  currentIndex = displayedContent.value.length;
  isTyping.value = true;

  typingInterval = setInterval(() => {
    if (currentIndex < content.value.length) {
      currentIndex++;
      displayedContent.value = content.value.substring(0, currentIndex);
    } else {
      if (typingInterval) {
        clearInterval(typingInterval);
        typingInterval = null;
      }
      isTyping.value = false;
      isComplete.value = true;
    }
  }, props.speed);
};

const stopTyping = () => {
  if (typingInterval) {
    clearInterval(typingInterval);
    typingInterval = null;
  }
  displayedContent.value = content.value;
  isTyping.value = false;
  isComplete.value = true;
};

const handleConversationStart = (event: ConversationStartEvent) => {
  console.log("SSE conversation started:", event);
};

const handleContent = (text: string) => {
  content.value += text;
  if (!isTyping.value) {
    startTyping();
  }
};

const handleMessage = (text: string) => {
  content.value = text;
  if (!isTyping.value) {
    startTyping();
  }
};

const handleDone = (event: DoneEvent) => {
  stopTyping();
  if (event.followUpQuestions) {
    followUpQuestions.value = event.followUpQuestions;
  }
  if (event.keyElements) {
    keyElements.value = event.keyElements;
  }
};

const handleError = (event: ErrorEvent) => {
  stopTyping();
  error.value = event.message;
};

const reset = () => {
  stopTyping();
  content.value = "";
  displayedContent.value = "";
  isComplete.value = false;
  error.value = null;
  followUpQuestions.value = [];
  keyElements.value = [];
  currentIndex = 0;
};

defineExpose({
  handleConversationStart,
  handleContent,
  handleMessage,
  handleDone,
  handleError,
  reset,
});

onMounted(() => {
  emit("mounted");
});
</script>

<template>
  <div class="sse-output">
    <div v-if="error" class="error-box">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ error }}</span>
    </div>

    <div v-else class="content-box">
      <div class="conversation-info" v-if="conversationId">
        <span class="conversation-badge">
          {{ isNewConversation ? "新建会话" : "继续会话" }}
        </span>
        <span class="conversation-id">{{ conversationId }}</span>
      </div>

      <div class="message-content">
        <pre class="typed-text">{{ displayedContent }}<span
            v-if="isTyping"
            class="cursor"
          >|</span></pre>
      </div>

      <div v-if="isComplete" class="meta-section">
        <div v-if="keyElements.length > 0" class="key-elements">
          <div class="section-title">关键要素</div>
          <div class="tags">
            <span
              v-for="(element, index) in keyElements"
              :key="index"
              class="tag tag-element"
            >
              {{ element }}
            </span>
          </div>
        </div>

        <div v-if="followUpQuestions.length > 0" class="follow-up-questions">
          <div class="section-title">追问建议</div>
          <ul class="question-list">
            <li
              v-for="(question, index) in followUpQuestions"
              :key="index"
              class="question-item"
            >
              {{ question }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sse-output {
  padding: 16px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5ff 100%);
  border-radius: 12px;
  border: 1px solid #e8e5ff;
  min-height: 100px;
}

.error-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.error-icon {
  font-size: 16px;
}

.error-text {
  color: #dc2626;
  font-size: 14px;
}

.content-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.conversation-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.conversation-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.conversation-id {
  font-size: 12px;
  color: #64748b;
  font-family: monospace;
}

.message-content {
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.typed-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #1e293b;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}

.cursor {
  display: inline-block;
  animation: blink 0.8s infinite;
  color: #6366f1;
  font-weight: bold;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

.meta-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(99, 102, 241, 0.1);
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 8px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.tag-element {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.question-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-item {
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  list-style-type: disc;
}

.question-item:hover {
  background: rgba(99, 102, 241, 0.08);
  color: #6366f1;
}
</style>
