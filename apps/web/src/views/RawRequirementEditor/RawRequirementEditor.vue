<script setup lang="ts">
import { useRoute } from "vue-router";
import RustFSUploader from "@/components/RustFSUploader.vue";
import { useRawRequirementCreateStore } from "./store";
import QuestionPanel from "./components/QuestionPanel.vue";

import { CollectionType } from "@req2task/dto";
import { useRequirementSubmit } from "./useRequirementSubmit";
import { storeToRefs } from "pinia";
import { ref, onMounted, computed } from "vue";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { rawRequirementsApi } from "@/api/rawRequirements";
import RequirementList from "./components/RequirementList.vue";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Loader2 } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";

const route = useRoute();
const projectId = route.params.projectId as string;
const rawRequirementId = route.params.rawRequirementId as string | undefined;

const store = useRawRequirementCreateStore();
store.projectId = projectId;
const rawRequirementSubmitHelper = useRequirementSubmit(store);
const { rawRequirement } = storeToRefs(store);
const loading = ref(false);

const formSchema = toTypedSchema(
  z.object({
    source: z.string().min(1, "请输入需求来源"),
    content: z.string().min(1, "请输入原始需求内容"),
    collectionType: z.nativeEnum(CollectionType, {
      required_error: "请选择采集方式",
    }),
    collectTime: z.string().nullable().optional(),
  })
);

const collectionTypeOptions = [
  { label: "会议", value: CollectionType.MEETING },
  { label: "访谈", value: CollectionType.INTERVIEW },
  { label: "文档", value: CollectionType.DOCUMENT },
  { label: "其他", value: CollectionType.OTHER },
];

onMounted(async () => {
  if (rawRequirementId) {
    loading.value = true;
    try {
      const data = await rawRequirementsApi.getRawRequirement(rawRequirementId);
      store.loadRawRequirement(data);
    } catch (error) {
      console.error("加载原始需求失败:", error);
    } finally {
      loading.value = false;
    }
  }
});

const handleSubmit = async () => {
  rawRequirementSubmitHelper.save();
};

const handleAnalyze = async () => {
  rawRequirementSubmitHelper.rawRequirementAnalyze();
};

const questionCount = computed(() => {
  return store.rawRequirement.questionAndAnswers.length;
});
const doneQuestionCount = computed(() => {
  return store.rawRequirement.questionAndAnswers.filter((item) => item.answer)
    .length;
});
const handlerGenerateRequirements = async () => {
  rawRequirementSubmitHelper.generateRequirements();
};

const getCollectionTypeLabel = (value: CollectionType | undefined) => {
  return collectionTypeOptions.find((opt) => opt.value === value)?.label ?? "";
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "";
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm") : dateStr;
};
</script>

<template>
  <div class="rq-edit-view-container">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold">{{ store.rawRequirement.id ? '更新原始需求' : '录入原始需求' }}</h1>
      <Button @click="handleSubmit">保存</Button>
    </div>

    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-8 w-full" />
      <Skeleton class="h-32 w-full" />
    </div>

    <template v-else>
      <Card class="meta-card">
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <Form
            :validation-schema="formSchema"
            :initial-values="rawRequirement"
            @submit="handleSubmit"
          >
            <div class="grid grid-cols-2 gap-4">
              <FormField v-slot="{ componentField, errorMessage }" name="source">
                <FormItem>
                  <FormLabel>需求来源</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      v-model="rawRequirement.source"
                      placeholder="名字/职位/部门"
                    />
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{ errorMessage }}</FormMessage>
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField, errorMessage }" name="collectionType">
                <FormItem>
                  <FormLabel>采集方式</FormLabel>
                  <FormControl>
                    <Select
                      v-bind="componentField"
                      v-model="rawRequirement.collectionType"
                    >
                      <SelectTrigger>
                        <SelectValue :placeholder="getCollectionTypeLabel(rawRequirement.collectionType) || '选择采集方式'" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="opt in collectionTypeOptions"
                          :key="opt.value"
                          :value="opt.value"
                        >
                          {{ opt.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{ errorMessage }}</FormMessage>
                </FormItem>
              </FormField>
            </div>

            <div class="grid grid-cols-2 gap-4 mt-4">
              <FormField v-slot="{ errorMessage }" name="collectTime">
                <FormItem>
                  <FormLabel>收集时间</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger as-child>
                        <Button
                          variant="outline"
                          :class="cn(
                            'w-full justify-start text-left font-normal',
                            !rawRequirement.collectTime && 'text-muted-foreground'
                          )"
                        >
                          <CalendarIcon class="mr-2 h-4 w-4" />
                          {{ rawRequirement.collectTime ? formatDate(rawRequirement.collectTime) : '选择收集时间' }}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent class="w-auto p-0">
                        <Calendar
                          :model-value="rawRequirement.collectTime ? dayjs(rawRequirement.collectTime).toDate() : undefined"
                          @update:model-value="(date) => {
                            if (date) {
                              rawRequirement.collectTime = date.toISOString();
                            } else {
                              rawRequirement.collectTime = null;
                            }
                          }"
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage v-if="errorMessage">{{ errorMessage }}</FormMessage>
                </FormItem>
              </FormField>
            </div>

            <FormField name="fileIds">
              <FormItem class="mt-4">
                <FormLabel>上传文件</FormLabel>
                <FormControl>
                  <RustFSUploader v-model="rawRequirement.fileIds" />
                </FormControl>
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField, errorMessage }" name="content">
              <FormItem class="mt-4">
                <FormLabel>原始需求内容</FormLabel>
                <FormControl>
                  <Textarea
                    v-bind="componentField"
                    v-model="rawRequirement.content"
                    placeholder="请输入原始需求内容"
                    :rows="4"
                  />
                </FormControl>
                <FormMessage v-if="errorMessage">{{ errorMessage }}</FormMessage>
              </FormItem>
            </FormField>
          </Form>
        </CardContent>
        <CardFooter class="flex gap-2">
          <Button @click="handleSubmit">保存</Button>
          <Button variant="secondary" @click="handleAnalyze">分析</Button>
        </CardFooter>
      </Card>

      <AppCard
        class="meta-card"
        title="追问与澄清"
        :current-step="doneQuestionCount"
        :total-steps="questionCount"
      >
        <template #extra>
          <Button @click="handlerGenerateRequirements">生成需求</Button>
        </template>

        <QuestionPanel :projectId="projectId" :store="store" />
      </AppCard>

      <AppCard class="meta-card" title="需求列表">
        <RequirementList :projectId="projectId" :store="store" />
      </AppCard>
    </template>
  </div>
</template>

<style scoped>
.rq-edit-view-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.meta-card {
  width: 100%;
}

.step-indicator {
  font-size: 12px;
  font-weight: 500;
  color: #a1a1aa;
}
</style>
