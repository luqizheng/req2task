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
import { requirementsApi } from "@/api/requirements";
import RequirementList from "./components/RequirementList.vue";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, FileText, HelpCircle, ListTodo, Sparkles, Save, Play, RotateCcw, Loader2 } from "lucide-vue-next";
import dayjs from "dayjs";
import { parseDate, DateValue } from "@internationalized/date";

const route = useRoute();
const projectId = route.params.projectId as string;
const rawRequirementId = route.params.rawRequirementId as string | undefined;

const store = useRawRequirementCreateStore();
store.projectId = projectId;
const rawRequirementSubmitHelper = useRequirementSubmit(store);
const { rawRequirement } = storeToRefs(store);
const loading = ref(false);
const isSaving = ref(false);
const isGenerating = ref(false);

const formSchema = toTypedSchema(
  z.object({
    title: z.string().nullable().optional(),
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
      const requirementsRes = await requirementsApi.getByRawRequirement(rawRequirementId);
      store.loadRequirementsByRawRequirement(rawRequirementId, requirementsRes || []);
    } catch (error) {
      console.error("加载原始需求失败:", error);
    } finally {
      loading.value = false;
    }
  }
});

const handleSubmit = async () => {
  isSaving.value = true;
  try {
    await rawRequirementSubmitHelper.save();
    await rawRequirementSubmitHelper.saveAllRequirements();
  } finally {
    isSaving.value = false;
  }
};

const handleAnalyze = async () => {
  rawRequirementSubmitHelper.rawRequirementAnalyze();
};

const handleGenerateTitle = async () => {
  if (!rawRequirement.value.content?.trim()) {
    return;
  }
  await rawRequirementSubmitHelper.generateTitle();
};

const questionCount = computed(() => {
  return store.rawRequirement.questionAndAnswers.length;
});
const doneQuestionCount = computed(() => {
  return store.rawRequirement.questionAndAnswers.filter((item) => item.answer)
    .length;
});
const handlerGenerateRequirements = async () => {
  isGenerating.value = true;
  try {
    if (!store.rawRequirement.id) {
      const saved = await rawRequirementSubmitHelper.save();
      if (!saved) {
        return;
      }
    }
    await rawRequirementSubmitHelper.generateRequirements();
  } finally {
    isGenerating.value = false;
  }
};

const getCollectionTypeLabel = (value: CollectionType | undefined) => {
  return collectionTypeOptions.find((opt) => opt.value === value)?.label ?? "";
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "";
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("YYYY-MM-DD") : dateStr;
};

const collectTimeDate = computed<DateValue | undefined>({
  get: () => {
    if (!rawRequirement.value.collectTime) return undefined;
    const d = dayjs(rawRequirement.value.collectTime);
    return d.isValid() ? parseDate(d.format("YYYY-MM-DD")) : undefined;
  },
  set: (date: DateValue | undefined) => {
    if (date) {
      rawRequirement.value.collectTime = date.toString();
    } else {
      rawRequirement.value.collectTime = null;
    }
  }
});
</script>

<template>
  <div class="h-[calc(100vh-7rem)] bg-muted/30">
    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-8 w-full" />
      <Skeleton class="h-32 w-full" />
    </div>

    <div v-else class="grid grid-cols-3 gap-4 h-full overflow-hidden">
      <!-- 左栏：原始需求输入 -->
      <Card class="flex flex-col h-full overflow-hidden">
        <CardHeader class="pb-4 border-b shrink-0">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <FileText class="h-5 w-5 text-primary" />
              <CardTitle class="text-base font-semibold">原始需求输入</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent class="flex-1 p-0 overflow-hidden">
          <ScrollArea class="h-full px-4 py-4">
            <Form
              :validation-schema="formSchema"
              :initial-values="rawRequirement"
              @submit="handleSubmit"
            >
              <div class="space-y-4">
                <FormField v-slot="{ componentField, errorMessage }" name="title">
                  <FormItem>
                    <FormLabel class="text-xs text-muted-foreground">标题</FormLabel>
                    <div class="flex gap-2">
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          :model-value="rawRequirement.title ?? ''"
                          placeholder="请输入标题"
                          class="h-9 flex-1"
                          @update:model-value="(val) => rawRequirement.title = typeof val === 'string' ? val || null : null"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        :disabled="!rawRequirement.content?.trim()"
                        title="AI 生成标题"
                        @click="handleGenerateTitle"
                      >
                        <Sparkles class="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage v-if="errorMessage" class="text-xs" />
                  </FormItem>
                </FormField>

                <div class="grid grid-cols-2 gap-4">
                  <FormField v-slot="{ componentField, errorMessage }" name="source">
                    <FormItem>
                      <FormLabel class="text-xs text-muted-foreground">来源</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          v-model="rawRequirement.source"
                          placeholder="名字/职位/部门"
                          class="h-9"
                        />
                      </FormControl>
                      <FormMessage v-if="errorMessage" class="text-xs" />
                    </FormItem>
                  </FormField>

                  <FormField v-slot="{ componentField, errorMessage }" name="collectionType">
                    <FormItem>
                      <FormLabel class="text-xs text-muted-foreground">收集类型</FormLabel>
                      <FormControl>
                        <Select
                          v-bind="componentField"
                          v-model="rawRequirement.collectionType"
                        >
                          <SelectTrigger class="h-9">
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
                      <FormMessage v-if="errorMessage" class="text-xs" />
                    </FormItem>
                  </FormField>
                </div>

                <FormField v-slot="{ errorMessage }" name="collectTime">
                  <FormItem>
                    <FormLabel class="text-xs text-muted-foreground">收集时间</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger as-child>
                          <Button
                            variant="outline"
                            class="w-full justify-start text-left font-normal h-9"
                            :class="!rawRequirement.collectTime && 'text-muted-foreground'"
                          >
                            <CalendarIcon class="mr-2 h-4 w-4" />
                            {{ rawRequirement.collectTime ? formatDate(rawRequirement.collectTime) : '选择收集时间' }}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent class="w-auto p-0">
                          <Calendar
                            v-model="collectTimeDate"
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage v-if="errorMessage" class="text-xs" />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField, errorMessage }" name="content">
                  <FormItem>
                    <FormLabel class="text-xs text-muted-foreground">原始内容</FormLabel>
                    <FormControl>
                      <Textarea
                        v-bind="componentField"
                        v-model="rawRequirement.content"
                        placeholder="请输入原始需求内容"
                        :rows="6"
                      />
                    </FormControl>
                    <FormMessage v-if="errorMessage" class="text-xs" />
                  </FormItem>
                </FormField>

                <FormField name="fileIds">
                  <FormItem>
                    <FormLabel class="text-xs text-muted-foreground">上传文件</FormLabel>
                    <FormControl>
                      <RustFSUploader v-model="rawRequirement.fileIds" />
                    </FormControl>
                  </FormItem>
                </FormField>
              </div>
            </Form>
          </ScrollArea>
        </CardContent>
        <div class="p-4 border-t shrink-0 flex gap-2">
          <Button variant="outline" class="flex-1 h-9" :disabled="isSaving" @click.stop="handleSubmit">
            <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
            <Save v-else class="w-4 h-4 mr-2" />
            {{ isSaving ? '保存中...' : '保存' }}
          </Button>
          <Button class="flex-1 h-9" :disabled="isSaving" @click="handleAnalyze">
            <Play class="w-4 h-4 mr-2" />
            分析
          </Button>
        </div>
      </Card>

      <!-- 中栏：追问与澄清 -->
      <Card class="flex flex-col h-full overflow-hidden">
        <CardHeader class="pb-4 border-b shrink-0">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <HelpCircle class="h-5 w-5 text-primary" />
              <CardTitle class="text-base font-semibold">追问与澄清</CardTitle>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="text-muted-foreground">{{ questionCount }} 个问题</span>
              <span class="text-muted-foreground">|</span>
              <span class="text-primary">{{ doneQuestionCount }}/{{ questionCount }} 已回答</span>
            </div>
          </div>
        </CardHeader>
        <CardContent class="flex-1 p-0 overflow-hidden">
          <ScrollArea class="h-full px-4 py-4">
            <QuestionPanel :projectId="projectId" :store="store" />
          </ScrollArea>
        </CardContent>
        <div class="p-4 border-t shrink-0">
          <Button class="w-full h-9" :disabled="isGenerating" @click="handlerGenerateRequirements">
            <Loader2 v-if="isGenerating" class="w-4 h-4 mr-2 animate-spin" />
            <ListTodo v-else class="w-4 h-4 mr-2" />
            {{ isGenerating ? '生成中...' : '生成需求' }}
          </Button>
        </div>
      </Card>

      <!-- 右栏：需求列表 -->
      <Card class="flex flex-col h-full overflow-hidden">
        <CardHeader class="pb-4 border-b shrink-0">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <ListTodo class="h-5 w-5 text-primary" />
              <CardTitle class="text-base font-semibold">{{ store.requirements.length }} 条需求</CardTitle>
            </div>
            <span class="text-xs text-muted-foreground">步骤 3/3</span>
          </div>
        </CardHeader>
        <CardContent class="flex-1 p-0 overflow-hidden">
          <ScrollArea class="h-full px-4 py-4">
            <RequirementList :projectId="projectId" :store="store" />
          </ScrollArea>
        </CardContent>
        <div class="p-4 border-t shrink-0 flex gap-2">
          <Button variant="outline" class="flex-1 h-9" :disabled="isSaving" @click="handlerGenerateRequirements">
            <RotateCcw class="w-4 h-4 mr-2" />
            重新生成
          </Button>
          <Button class="flex-1 h-9" :disabled="isSaving" @click="handleSubmit">
            <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
            <Save v-else class="w-4 h-4 mr-2" />
            {{ isSaving ? '保存中...' : '保存需求' }}
          </Button>
        </div>
      </Card>
    </div>
  </div>
</template>
