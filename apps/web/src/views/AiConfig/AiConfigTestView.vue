<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElCard, ElButton, ElInput, ElSelect, ElOption, ElTag } from "element-plus";
import { ArrowLeft, VideoPlay } from "@element-plus/icons-vue";
import { useAiStore } from "@/stores/ai";
import { aiApi } from "@/api";
import type { LLMConfigResponse } from "@/api/ai";

const route = useRoute();
const router = useRouter();
const aiStore = useAiStore();

const configId = ref<string>((route.params.id as string) || "");
const testMessage = ref("请回复\"配置测试成功\"以确认连接正常。");
const testing = ref(false);
const testResult = ref<{
  success: boolean;
  content: string;
  latencyMs?: number;
  error?: string;
} | null>(null);

const selectedConfig = computed<LLMConfigResponse | undefined>(() => {
  return aiStore.configs.find(c => c.id === configId.value);
});

const configOptions = computed(() => {
  return aiStore.configs.map(c => ({
    value: c.id,
    label: `${c.name} (${c.provider}/${c.modelName})`,
    disabled: !c.isActive,
  }));
});

const handleTest = async () => {
  if (!configId.value) {
    ElMessage.warning("请先选择要测试的配置");
    return;
  }

  testing.value = true;
  testResult.value = null;

  try {
    const response = await aiApi.testLLMConfig(configId.value, testMessage.value);
    testResult.value = {
      success: response.success,
      content: response.content,
      latencyMs: response.latencyMs,
      error: response.error,
    };

    if (response.success) {
      ElMessage.success("测试成功");
    } else {
      ElMessage.error(response.error || "测试失败");
    }
  } catch (error) {
    testResult.value = {
      success: false,
      content: "",
      error: error instanceof Error ? error.message : "测试请求失败",
    };
    ElMessage.error("测试请求失败");
  } finally {
    testing.value = false;
  }
};

const handleGoBack = () => {
  router.push("/ai/config");
};

onMounted(async () => {
  if (aiStore.configs.length === 0) {
    await aiStore.fetchConfigs();
  }

  if (configId.value && !selectedConfig.value) {
    ElMessage.warning("未找到对应的配置");
  }
});
</script>

<template>
  <div class="ai-config-test-view">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text @click="handleGoBack">
        返回配置列表
      </el-button>
      <h2 class="page-title">LLM 配置测试</h2>
    </div>

    <el-card v-loading="aiStore.isLoading">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><VideoPlay /></el-icon>
            测试 LLM 配置
          </span>
        </div>
      </template>

      <div class="test-form">
        <el-form label-width="120">
          <el-form-item label="选择配置">
            <el-select
              v-model="configId"
              placeholder="请选择要测试的配置"
              style="width: 100%"
            >
              <el-option
                v-for="option in configOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
                :disabled="option.disabled"
              />
            </el-select>
          </el-form-item>

          <el-form-item v-if="selectedConfig" label="配置信息">
            <div class="config-info">
              <el-tag type="info" size="small">提供商: {{ selectedConfig.provider }}</el-tag>
              <el-tag type="info" size="small">模型: {{ selectedConfig.modelName }}</el-tag>
              <el-tag v-if="selectedConfig.baseUrl" type="info" size="small">
                Base URL: {{ selectedConfig.baseUrl }}
              </el-tag>
              <el-tag type="info" size="small">
                最大Token: {{ selectedConfig.maxTokens }}
              </el-tag>
              <el-tag type="info" size="small">
                温度: {{ selectedConfig.temperature }}
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item label="测试消息">
            <el-input
              v-model="testMessage"
              type="textarea"
              :rows="4"
              placeholder="输入测试消息"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="testing"
              :disabled="!configId"
              @click="handleTest"
            >
              发送测试
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="testResult" class="test-result">
        <el-divider content-position="left">测试结果</el-divider>

        <el-card :class="['result-card', testResult.success ? 'success' : 'error']">
          <template #header>
            <div class="result-header">
              <span>{{ testResult.success ? "✓ 测试成功" : "✗ 测试失败" }}</span>
              <el-tag v-if="testResult.latencyMs" type="info" size="small">
                响应时间: {{ testResult.latencyMs }}ms
              </el-tag>
            </div>
          </template>

          <div v-if="testResult.success" class="result-content">
            <p><strong>AI 响应:</strong></p>
            <div class="response-text">{{ testResult.content }}</div>
          </div>

          <div v-else class="error-content">
            <p><strong>错误信息:</strong></p>
            <div class="error-text">{{ testResult.error }}</div>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.ai-config-test-view {
  padding: var(--app-padding-base, 24px);
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: var(--app-space-lg, 24px);
}

.page-title {
  font-size: var(--el-font-size-large);
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: var(--el-font-size-base);
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.test-form {
  max-width: 600px;
}

.config-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.test-result {
  margin-top: 24px;
}

.result-card {
  margin-top: 16px;
}

.result-card.success :deep(.el-card__header) {
  background-color: var(--el-color-success-light-9);
}

.result-card.error :deep(.el-card__header) {
  background-color: var(--el-color-danger-light-9);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-content,
.error-content {
  padding: 12px;
}

.response-text,
.error-text {
  background-color: var(--el-fill-color-light);
  padding: 12px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.6;
}

.error-text {
  color: var(--el-color-danger);
}
</style>
