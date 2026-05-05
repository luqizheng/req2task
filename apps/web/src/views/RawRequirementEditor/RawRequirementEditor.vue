<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import RustFSUploader from "@/components/RustFSUploader.vue";
import { useRawRequirementCreateStore } from "./store";
import QuestionPanel from "./components/QuestionPanel.vue";
import AiModuleConfirm from "./components/AiModuleConfirm.vue";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Field as VeeField } from "vee-validate";
import { useForm } from "vee-validate";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarIcon,
  FileText,
  HelpCircle,
  ListTodo,
  Sparkles,
  Save,
  Play,
  RotateCcw,
  Loader2,
} from "lucide-vue-next";
import dayjs from "dayjs";
import { parseDate, DateValue } from "@internationalized/date";

const route = useRoute();
const router = useRouter();
const projectId = route.params.projectId as string;
const rawRequirementId = route.params.rawRequirementId as string | undefined;

const store = useRawRequirementCreateStore();
store.projectId = projectId;
const rawRequirementSubmitHelper = useRequirementSubmit(store);
const { rawRequirement } = storeToRefs(store);
const loading = ref(false);
const isSaving = ref(false);
const isGenerating = ref(false);
const isAnalyzing = ref(false);
const showModuleConfirm = ref(false);

const formSchema = toTypedSchema(
  z.object({
    title: z.string().nullable().optional(),
    source: z.string().min(1, "请输入需求来源"),
    content: z.string().min(1, "请输入原始需求内容"),
    collectionType: z.nativeEnum(CollectionType, {
      required_error: "请选择采集方式",
    }),
    collectTime: z.string().nullable().optional(),
  }),
);

const { handleSubmit, setFieldValue } = useForm({
  validationSchema: formSchema,
  initialValues: rawRequirement.value,
});

const collectionTypeOptions = [
  { label: "会议", value: CollectionType.MEETING },
  { label: "访谈", value: CollectionType.INTERVIEW },
  { label: "文档", value: CollectionType.DOCUMENT },
  { label: "其他", value: CollectionType.OTHER },
];

onMounted(async () => {
  // 新创建模式，不需要加载数据
  if (rawRequirementId === "new") {
    return;
  }

  if (rawRequirementId) {
    loading.value = true;
    try {
      const data = await rawRequirementsApi.getRawRequirement(rawRequirementId);
      store.loadRawRequirement(data);
      const requirementsRes =
        await requirementsApi.getByRawRequirement(rawRequirementId);
      store.loadRequirementsByRawRequirement(
        rawRequirementId,
        requirementsRes || [],
      );
      // 同步加载的数据到表单
      setFieldValue("title", rawRequirement.value.title);
      setFieldValue("source", rawRequirement.value.source);
      setFieldValue("content", rawRequirement.value.content);
      setFieldValue("collectionType", rawRequirement.value.collectionType);
      setFieldValue("collectTime", rawRequirement.value.collectTime);
    } catch (error) {
      console.error("加载原始需求失败:", error);
    } finally {
      loading.value = false;
    }
  }
});

const onSubmit = handleSubmit(async () => {
  isSaving.value = true;
  try {
    const isNew = !store.rawRequirement.id;
    await rawRequirementSubmitHelper.save();
    await rawRequirementSubmitHelper.saveAllRequirements();

    // 如果是新创建，保存成功后导航到编辑页面
    if (isNew && store.rawRequirement.id) {
      await router.push(`/projects/${projectId}/raw-requirements/${store.rawRequirement.id}`);
    }
  } finally {
    isSaving.value = false;
  }
});

const handleAnalyze = async () => {
  isAnalyzing.value = true;
  try {
    await rawRequirementSubmitHelper.rawRequirementAnalyze();
  } finally {
    isAnalyzing.value = false;
  }
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
  return store.visibleQuestions.filter((item) => item.answer).length;
});
const handleGenerateRequirements = async () => {
  isGenerating.value = true;
  try {
    if (!store.rawRequirement.id) {
      const saved = await rawRequirementSubmitHelper.save();
      if (!saved) {
        return;
      }
    }
    await rawRequirementSubmitHelper.generateRequirements();

    const needsConfirm = store.requirements.some(
      (r) => !r.moduleId || r.moduleId === 'NEW'
    );
    if (needsConfirm) {
      showModuleConfirm.value = true;
    }
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
      setFieldValue("collectTime", date.toString());
    } else {
      rawRequirement.value.collectTime = null;
      setFieldValue("collectTime", null);
    }
  },
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
        <CardContent class="flex-1 overflow-hidden">
          <ScrollArea class="h-full px-4 py-4 bg-transparent">
            <form style="padding: 10px" @submit="onSubmit">
              <FieldGroup>
                <VeeField v-slot="{ errors }" name="content">
                  <Field :data-invalid="!!errors.length">
                    <FieldLabel>原始内容</FieldLabel>
                    <Textarea :model-value="rawRequirement.content" placeholder="请输入原始需求内容" :rows="6"
                      :aria-invalid="!!errors.length" @update:model-value="
                        (val) => {
                          rawRequirement.content = String(val);
                          setFieldValue('content', String(val));
                        }
                      " />
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>
                <VeeField v-slot="{ errors }" name="title">
                  <Field :data-invalid="!!errors.length">

                    <FieldLabel>标题</FieldLabel>
                    <InputGroup>
                      <InputGroupInput :model-value="rawRequirement.title ?? ''" placeholder="请输入标题"
                        :aria-invalid="!!errors.length" @update:model-value="
                          (val) => {
                            rawRequirement.title = val || null;
                            setFieldValue('title', val || null);
                          }
                        " />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton type="button" variant="outline" :disabled="!rawRequirement.content?.trim()"
                          title="AI 生成标题" @click="handleGenerateTitle">
                          <Sparkles />
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>

                <VeeField v-slot="{ errors }" name="source">
                  <Field :data-invalid="!!errors.length">
                    <FieldLabel>来源</FieldLabel>
                    <Input :model-value="rawRequirement.source" placeholder="名字/职位/部门" :aria-invalid="!!errors.length"
                      @update:model-value="
                        (val) => {
                          rawRequirement.source = String(val);
                          setFieldValue('source', String(val));
                        }
                      " />
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>

                <VeeField v-slot="{ errors }" name="collectionType">
                  <Field :data-invalid="!!errors.length">
                    <FieldLabel>收集类型</FieldLabel>
                    <Select :model-value="rawRequirement.collectionType" :aria-invalid="!!errors.length"
                      @update:model-value="
                        (val) => {
                          const casted = val as CollectionType;
                          rawRequirement.collectionType = casted;
                          setFieldValue('collectionType', casted);
                        }
                      ">
                      <SelectTrigger>
                        <SelectValue :placeholder="getCollectionTypeLabel(
                          rawRequirement.collectionType,
                        ) || '选择采集方式'
                          " />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="opt in collectionTypeOptions" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>

                <VeeField v-slot="{ errors }" name="collectTime">
                  <Field :data-invalid="!!errors.length">
                    <FieldLabel>收集时间</FieldLabel>
                    <Popover>
                      <PopoverTrigger as-child>
                        <Button variant="outline" :class="!rawRequirement.collectTime &&
                          'text-muted-foreground'
                          ">
                          <CalendarIcon />
                          {{
                            rawRequirement.collectTime
                              ? formatDate(rawRequirement.collectTime)
                              : "选择收集时间"
                          }}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar v-model="collectTimeDate" />
                      </PopoverContent>
                    </Popover>
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>



                <Field>
                  <FieldLabel>上传文件</FieldLabel>
                  <RustFSUploader v-model="rawRequirement.fileIds" />
                </Field>
              </FieldGroup>
            </form>
          </ScrollArea>
        </CardContent>
        <div class="p-4 border-t shrink-0 flex gap-2">
          <Button variant="outline" class="flex-1 h-9" :disabled="isSaving" @click.stop="onSubmit">
            <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
            <Save v-else class="w-4 h-4 mr-2" />
            {{ isSaving ? "保存中..." : "保存" }}
          </Button>
          <Button class="flex-1 h-9" :disabled="isSaving || isAnalyzing" @click="handleAnalyze">
            <Loader2 v-if="isAnalyzing" class="w-4 h-4 mr-2 animate-spin" />
            <Play v-else class="w-4 h-4 mr-2" />
            {{ isAnalyzing ? "分析中..." : "分析" }}
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
          <Button class="w-full h-9" :disabled="isGenerating" @click="handleGenerateRequirements">
            <Loader2 v-if="isGenerating" class="w-4 h-4 mr-2 animate-spin" />
            <ListTodo v-else class="w-4 h-4 mr-2" />
            {{ isGenerating ? "生成中..." : "生成需求" }}
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
          <Button variant="outline" class="flex-1 h-9" :disabled="isSaving" @click="handleGenerateRequirements">
            <RotateCcw class="w-4 h-4 mr-2" />
            重新生成
          </Button>
          <Button class="flex-1 h-9" :disabled="isSaving" @click="onSubmit">
            <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
            <Save v-else class="w-4 h-4 mr-2" />
            {{ isSaving ? "保存中..." : "保存需求" }}
          </Button>
        </div>
      </Card>
    </div>

    <AiModuleConfirm
      v-model:open="showModuleConfirm"
      :requirements="store.requirements"
      :project-id="projectId"
      @confirmed="() => {}"
    />
  </div>
</template>
