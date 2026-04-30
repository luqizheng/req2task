<script setup lang="ts">
import { ref } from "vue";
import { useRequirementCollectStore } from "../store";
import { showToast } from "@/lib/toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SendHorizontal, Loader2 } from "lucide-vue-next";

const store = useRequirementCollectStore();

const requirementContent = ref("");
const isSubmitting = ref(false);

const handleSubmit = async () => {
  if (!requirementContent.value.trim() || !store.currentCollection) {
    return;
  }

  try {
    isSubmitting.value = true;
    store.addRawRequirement({
      id: crypto.randomUUID(),
      content: requirementContent.value,
      source: store.currentCollection.title,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    requirementContent.value = "";
    showToast.success("需求已提交");
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <Card class="h-full">
    <CardHeader>
      <CardTitle class="text-lg">需求输入</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div
        v-if="!store.currentCollection"
        class="text-center py-8 text-slate-400"
      >
        请先创建收集会话
      </div>

      <template v-else>
        <div class="space-y-2">
          <label class="text-sm font-medium">收集内容</label>
          <Textarea
            v-model="requirementContent"
            placeholder="输入需求内容..."
            class="min-h-[200px] resize-none"
            :disabled="isSubmitting"
          />
        </div>

        <Button
          @click="handleSubmit"
          :disabled="!requirementContent.trim() || isSubmitting"
          class="w-full"
        >
          <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
          <SendHorizontal v-else class="mr-2 h-4 w-4" />
          {{ isSubmitting ? "提交中..." : "提交需求" }}
        </Button>
      </template>
    </CardContent>
  </Card>
</template>
