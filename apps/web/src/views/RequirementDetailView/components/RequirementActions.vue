<script setup lang="ts">
import { ref } from "vue";
import type { RequirementResponseDto, RequirementStatus } from "@req2task/dto";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Edit,
  Trash2,
  Download,

  Loader2,
} from "lucide-vue-next";

const props = defineProps<{
  requirement: RequirementResponseDto;
  allowedTransitions?: Array<{ to: string; label: string; color: string }>;
  isDeleting?: boolean;
  isTransitioning?: boolean;
  isExporting?: boolean;
}>();

const emit = defineEmits<{
  (e: "edit"): void;
  (e: "delete"): void;
  (e: "status-change", status: RequirementStatus): void;
  (e: "export"): void;
}>();

const selectedStatus = ref<string>("");
const showDeleteDialog = ref(false);

const handleStatusChange = (newStatus: unknown) => {
  if (typeof newStatus === 'string' && newStatus !== props.requirement.status) {
    emit("status-change", newStatus as RequirementStatus);
  }
  selectedStatus.value = "";
};

const confirmDelete = () => {
  emit("delete");
  showDeleteDialog.value = false;
};
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg flex items-center gap-2">
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        操作
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <Button
        variant="outline"
        class="w-full justify-start"
        @click="emit('edit')"
      >
        <Edit class="w-4 h-4 mr-2" />
        编辑需求
      </Button>

      <div class="space-y-2">
        <label class="text-sm font-medium text-slate-700">状态变更</label>
        <Select
          v-model="selectedStatus"
          @update:model-value="handleStatusChange"
        >
          <SelectTrigger class="w-full">
            <SelectValue placeholder="选择新状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="transition in allowedTransitions"
              :key="transition.to"
              :value="transition.to"
              :disabled="isTransitioning"
            >
              <div class="flex items-center gap-2">
                <span
                  class="w-2 h-2 rounded-full"
                  :style="{ backgroundColor: transition.color }"
                />
                {{ transition.label }}
              </div>
            </SelectItem>
            <SelectItem
              v-if="!allowedTransitions || allowedTransitions.length === 0"
              disabled
              value=""
            >
              暂无可用状态
            </SelectItem>
          </SelectContent>
        </Select>
        <div
          v-if="isTransitioning"
          class="flex items-center gap-2 text-sm text-slate-500"
        >
          <Loader2 class="w-4 h-4 animate-spin" />
          状态更新中...
        </div>
      </div>

      <Button
        variant="outline"
        class="w-full justify-start"
        :disabled="isExporting"
        @click="emit('export')"
      >
        <Download v-if="!isExporting" class="w-4 h-4 mr-2" />
        <Loader2 v-else class="w-4 h-4 mr-2 animate-spin" />
        导出需求文档
      </Button>

      <AlertDialog v-model:open="showDeleteDialog">
        <AlertDialogTrigger as-child>
          <Button
            variant="destructive"
            class="w-full justify-start"
            :disabled="isDeleting"
          >
            <Trash2 v-if="!isDeleting" class="w-4 h-4 mr-2" />
            <Loader2 v-else class="w-4 h-4 mr-2 animate-spin" />
            删除需求
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除需求 "<strong>{{ requirement.title }}</strong
              >" 吗？ 此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" @click="confirmDelete">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CardContent>
  </Card>
</template>
