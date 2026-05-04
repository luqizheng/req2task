<script setup lang="ts">
import { ref } from "vue";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, RefreshCw, CheckCircle, AlertCircle } from "lucide-vue-next";
import { aiApi } from "@/api/ai";
import { toast } from "vue-sonner";

const props = defineProps<{
  projectId: string;
}>();

const isRebuilding = ref(false);
const cleanRebuild = ref(false);
const lastResult = ref<{
  success: boolean;
  requirements: number;
  rawRequirements: number;
  total: number;
} | null>(null);

const handleRebuild = async () => {
  isRebuilding.value = true;
  lastResult.value = null;

  try {
    const result = await aiApi.rebuildVector({ projectId: props.projectId, clean: cleanRebuild.value });

    if (result.success && result.data) {
      lastResult.value = {
        success: true,
        requirements: result.data.requirements,
        rawRequirements: result.data.rawRequirements,
        total: result.data.total,
      };
      toast.success("向量存储重建成功", {
        description: `已索引 ${result.data.total} 条需求`,
      });
    } else {
      throw new Error(result.message || "重建失败");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "重建过程中发生错误";
    lastResult.value = { success: false, requirements: 0, rawRequirements: 0, total: 0 };
    toast.error("重建失败", { description: message });
  } finally {
    isRebuilding.value = false;
  }
};
</script>

<template>
  <Card class="border-slate-200 shadow-sm">
    <CardHeader class="pb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
            <Database class="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <CardTitle class="text-slate-800">向量存储</CardTitle>
            <CardDescription class="text-slate-500 mt-0.5">
              重建需求向量索引以支持相似性搜索
            </CardDescription>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div class="space-y-1">
          <p class="text-sm font-medium text-slate-700">重建向量索引</p>
          <p class="text-xs text-slate-500">
            重新计算所有需求的向量表示，用于需求关联检测
          </p>
          <label class="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              v-model="cleanRebuild"
              type="checkbox"
              class="w-3.5 h-3.5 rounded border-slate-300 text-violet-600 cursor-pointer"
            />
            <span class="text-xs text-slate-500">Clean rebuild（删除并重建 collection）</span>
          </label>
        </div>
        <Button
          variant="outline"
          :disabled="isRebuilding"
          @click="handleRebuild"
        >
          <RefreshCw
            class="w-4 h-4 mr-2"
            :class="{ 'animate-spin': isRebuilding }"
          />
          {{ isRebuilding ? "重建中..." : "重建索引" }}
        </Button>
      </div>

      <div
        v-if="lastResult?.success"
        class="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
      >
        <CheckCircle class="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <div class="flex-1">
          <p class="text-sm font-medium text-emerald-800">重建完成</p>
          <div class="flex items-center gap-2 mt-1">
            <Badge variant="outline" class="bg-white text-emerald-700 border-emerald-200">
              正式需求: {{ lastResult.requirements }}
            </Badge>
            <Badge variant="outline" class="bg-white text-emerald-700 border-emerald-200">
              原始需求: {{ lastResult.rawRequirements }}
            </Badge>
            <Badge variant="outline" class="bg-white text-emerald-700 border-emerald-200">
              总计: {{ lastResult.total }}
            </Badge>
          </div>
        </div>
      </div>

      <div
        v-else-if="lastResult && !lastResult.success"
        class="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
      >
        <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0" />
        <div>
          <p class="text-sm font-medium text-red-800">重建失败</p>
          <p class="text-xs text-red-600 mt-0.5">请检查 ChromaDB 和 Ollama 服务状态</p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
