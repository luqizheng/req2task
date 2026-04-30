<script setup lang="ts">
import { useRequirementCollectStore } from "../store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Lightbulb,
  FileText,
  GitBranch,
  RefreshCw,
} from "lucide-vue-next";

const store = useRequirementCollectStore();

const conflictTypeConfig = {
  duplicate: { label: "重复", color: "bg-yellow-100 text-yellow-700" },
  contradiction: { label: "矛盾", color: "bg-red-100 text-red-700" },
  dependency: { label: "依赖", color: "bg-blue-100 text-blue-700" },
};

const handleAnalyze = async () => {
  store.setLoading(true);
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    store.setAnalysisResult({
      conflicts: [],
      suggestions: ["建议将相似需求合并", "注意需求间的依赖关系"],
      summary: "已完成初步分析",
    });
  } finally {
    store.setLoading(false);
  }
};
</script>

<template>
  <Card class="h-full">
    <CardHeader>
      <CardTitle class="text-lg flex items-center justify-between">
        <span>分析面板</span>
        <Button
          size="sm"
          variant="outline"
          @click="handleAnalyze"
          :disabled="store.rawRequirements.length === 0 || store.isLoading"
        >
          <RefreshCw
            class="mr-2 h-4 w-4"
            :class="{ 'animate-spin': store.isLoading }"
          />
          分析
        </Button>
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <div
        v-if="store.rawRequirements.length === 0"
        class="text-center py-12 text-slate-400"
      >
        请先添加需求
      </div>

      <template v-else-if="store.analysisResult">
        <div v-if="store.analysisResult.conflicts.length > 0" class="space-y-3">
          <h4 class="text-sm font-medium flex items-center gap-2">
            <AlertTriangle class="h-4 w-4 text-amber-500" />
            冲突检测
          </h4>
          <Alert
            v-for="conflict in store.analysisResult.conflicts"
            :key="conflict.id"
            variant="destructive"
          >
            <AlertTriangle class="h-4 w-4" />
            <AlertTitle class="flex items-center gap-2">
              {{ conflictTypeConfig[conflict.type]?.label || conflict.type }}
              <Badge :class="conflictTypeConfig[conflict.type]?.color">
                {{ conflict.type }}
              </Badge>
            </AlertTitle>
            <AlertDescription>
              {{ conflict.description }}
            </AlertDescription>
          </Alert>
        </div>

        <div v-if="store.analysisResult.suggestions.length > 0" class="space-y-3">
          <h4 class="text-sm font-medium flex items-center gap-2">
            <Lightbulb class="h-4 w-4 text-blue-500" />
            优化建议
          </h4>
          <div class="space-y-2">
            <div
              v-for="(suggestion, index) in store.analysisResult.suggestions"
              :key="index"
              class="flex items-start gap-2 text-sm"
            >
              <Lightbulb class="h-4 w-4 text-blue-500 mt-0.5" />
              <span>{{ suggestion }}</span>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium flex items-center gap-2">
            <FileText class="h-4 w-4 text-slate-500" />
            关联需求
          </h4>
          <div class="grid gap-2">
            <div
              v-for="req in store.rawRequirements.slice(0, 3)"
              :key="req.id"
              class="p-3 border rounded-lg bg-slate-50"
            >
              <div class="flex items-center gap-2 mb-1">
                <GitBranch class="h-3 w-3 text-slate-400" />
                <span class="text-xs text-slate-500 truncate">
                  {{ req.id.slice(0, 8) }}
                </span>
              </div>
              <p class="text-sm line-clamp-2">{{ req.content }}</p>
            </div>
          </div>
        </div>

        <div v-if="store.analysisResult.summary" class="pt-4 border-t">
          <p class="text-sm text-slate-600">{{ store.analysisResult.summary }}</p>
        </div>
      </template>

      <div v-else class="text-center py-12 text-slate-400">
        点击"分析"按钮开始分析
      </div>
    </CardContent>
  </Card>
</template>
