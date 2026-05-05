<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { wizardApi } from '@/api/wizard';
import type { WizardStepDto, TechStackDto } from '@req2task/dto';
import { SystemType, ArchitectureType, DatabaseType, CloudProvider, SecurityLevel, ProjectScale } from '@req2task/dto';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import WizardProgress from '@/components/wizard/WizardProgress.vue';
import TechStackCard from '@/components/wizard/TechStackCard.vue';
import { toast } from 'vue-sonner';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-vue-next';

const router = useRouter();
const isSubmitting = ref(false);
const isLoadingSteps = ref(true);
const isLoadingSuggestion = ref(false);

const wizardSteps = ref<WizardStepDto[]>([]);
const currentStepIndex = ref(0);

const formData = ref<Record<string, unknown>>({
  name: '',
  description: '',
  businessDomain: '',
  systemType: undefined as string | undefined,
  targetAudience: '',
  architectureType: undefined as string | undefined,
  isMicroservices: false,
  frontendFramework: '',
  backendFramework: '',
  backendLanguage: '',
  databaseTypes: [] as string[],
  backendOrm: '',
  cloudProvider: undefined as string | undefined,
  securityLevel: undefined as string | undefined,
  projectScale: undefined as string | undefined,
  teamSize: undefined as number | undefined,
  expectedDurationMonths: undefined as number | undefined,
  budget: undefined as number | undefined,
});

const techStackSuggestion = ref<TechStackDto | null>(null);
const techStackFromSuggestion = ref<TechStackDto | null>(null);

const currentStep = computed(() => wizardSteps.value[currentStepIndex.value]);
const isFirstStep = computed(() => currentStepIndex.value === 0);
const isLastStep = computed(() => currentStepIndex.value === wizardSteps.value.length - 1);
const canProceed = computed(() => validateCurrentStep());

const projectKeyValidation = computed(() => {
  const name = formData.value.name as string;
  if (!name) return { valid: false, value: '' };
  const key = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 20)
    .toUpperCase();
  return { valid: true, value: key };
});

function validateCurrentStep(): boolean {
  const step = currentStep.value;
  if (!step) return true;

  if (step.id === 'step-1-basic') {
    return !!(formData.value.name && (formData.value.name as string).trim().length > 0);
  }

  if (step.id === 'step-2-system-type') {
    return !!formData.value.systemType;
  }

  if (step.id === 'step-3-architecture') {
    return !!formData.value.architectureType;
  }

  if (step.id === 'step-5-database') {
    return !!(formData.value.databaseTypes && (formData.value.databaseTypes as string[]).length > 0);
  }

  if (step.id === 'step-7-scale') {
    return !!formData.value.projectScale;
  }

  return true;
}

function goToStep(stepIndex: number) {
  if (stepIndex >= 0 && stepIndex < wizardSteps.value.length) {
    currentStepIndex.value = stepIndex;
  }
}

function nextStep() {
  if (canProceed.value && !isLastStep.value) {
    currentStepIndex.value++;
  }
}

function prevStep() {
  if (!isFirstStep.value) {
    currentStepIndex.value--;
  }
}

function updateField(key: string, value: unknown) {
  const keys = key.split('.');
  if (keys.length === 1) {
    formData.value[key] = value;
  } else {
    const mainKey = keys[0];
    const subKey = keys[1];
    if (!formData.value[mainKey]) {
      formData.value[mainKey] = {};
    }
    (formData.value[mainKey] as Record<string, unknown>)[subKey] = value;
  }

  if (key === 'systemType' && value) {
    loadTechStackSuggestion(value as string);
  }
}

async function loadWizardSteps() {
  try {
    isLoadingSteps.value = true;
    wizardSteps.value = await wizardApi.getSteps();
  } catch (error) {
    toast.error('加载向导步骤失败');
    console.error(error);
  } finally {
    isLoadingSteps.value = false;
  }
}

async function loadTechStackSuggestion(systemType: string) {
  try {
    isLoadingSuggestion.value = true;
    const suggestion = await wizardApi.getTechStackSuggestion({
      systemType: systemType as SystemType,
    });
    techStackSuggestion.value = suggestion;
  } catch (error) {
    console.error('Failed to load tech stack suggestion:', error);
  } finally {
    isLoadingSuggestion.value = false;
  }
}

function applyTechStack(techStack: TechStackDto) {
  techStackFromSuggestion.value = techStack;

  if (techStack.frontend) {
    formData.value.frontendFramework = techStack.frontend.framework;
  }
  if (techStack.backend) {
    formData.value.backendFramework = techStack.backend.framework;
    formData.value.backendLanguage = techStack.backend.language;
    formData.value.backendOrm = techStack.backend.orm;
  }
  if (techStack.infrastructure) {
  }
  if (techStack.devops) {
  }

  toast.success('已应用推荐技术栈');
}

async function handleSubmit() {
  if (!canProceed.value) {
    toast.error('请填写必填项');
    return;
  }

  const projectKey = projectKeyValidation.value.value;
  if (!projectKey) {
    toast.error('项目名称不能为空');
    return;
  }

  isSubmitting.value = true;
  try {
    const techStack: Partial<TechStackDto> = {};
    if (techStackFromSuggestion.value?.frontend || formData.value.frontendFramework) {
      techStack.frontend = {
        framework: formData.value.frontendFramework as string || techStackFromSuggestion.value?.frontend?.framework,
        language: techStackFromSuggestion.value?.frontend?.language,
      };
    }
    if (techStackFromSuggestion.value?.backend || formData.value.backendFramework) {
      techStack.backend = {
        framework: formData.value.backendFramework as string || techStackFromSuggestion.value?.backend?.framework,
        language: formData.value.backendLanguage as string || techStackFromSuggestion.value?.backend?.language,
        orm: formData.value.backendOrm as string || techStackFromSuggestion.value?.backend?.orm,
      };
    }
    if (techStackFromSuggestion.value?.infrastructure) {
      techStack.infrastructure = techStackFromSuggestion.value.infrastructure;
    }
    if (techStackFromSuggestion.value?.devops) {
      techStack.devops = techStackFromSuggestion.value.devops;
    }

    await wizardApi.completeWizard({
      name: formData.value.name as string,
      description: formData.value.description as string || undefined,
      projectKey,
      systemType: formData.value.systemType as SystemType || undefined,
      architectureType: formData.value.architectureType as ArchitectureType || undefined,
      techStack: Object.keys(techStack).length > 0 ? techStack as TechStackDto : undefined,
      databaseTypes: formData.value.databaseTypes as DatabaseType[] || undefined,
      cloudProvider: formData.value.cloudProvider as CloudProvider || undefined,
      securityLevel: formData.value.securityLevel as SecurityLevel || undefined,
      projectScale: formData.value.projectScale as ProjectScale || undefined,
      teamSize: formData.value.teamSize as number || undefined,
      isMicroservices: formData.value.isMicroservices as boolean || undefined,
      expectedDurationMonths: formData.value.expectedDurationMonths as number || undefined,
      budget: formData.value.budget as number || undefined,
      businessDomain: formData.value.businessDomain as string || undefined,
      targetAudience: formData.value.targetAudience as string || undefined,
    });

    toast.success('项目创建成功');
    router.push('/projects');
  } catch (error: any) {
    toast.error(error?.message || '项目创建失败');
  } finally {
    isSubmitting.value = false;
  }
}

function handleCancel() {
  router.push('/projects');
}

onMounted(() => {
  loadWizardSteps();
});

watch(() => formData.value.systemType, (newVal) => {
  if (newVal) {
    loadTechStackSuggestion(newVal as string);
  }
});
</script>

<template>
  <div class="container mx-auto py-8 max-w-4xl">
    <div class="mb-8">
      <h1 class="text-2xl font-bold mb-2">创建项目向导</h1>
      <p class="text-muted-foreground">通过向导快速配置项目基本信息和技术栈</p>
    </div>

    <div v-if="isLoadingSteps" class="flex items-center justify-center py-20">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </div>

    <template v-else-if="wizardSteps.length">
      <WizardProgress
        :steps="wizardSteps"
        :current-step="currentStepIndex + 1"
        class="mb-8"
        @go-to-step="goToStep"
      />

      <div class="space-y-6">
        <Card v-show="currentStepIndex === 0">
          <CardHeader>
            <CardTitle>{{ currentStep?.title }}</CardTitle>
            <CardDescription>{{ currentStep?.description }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <Field :data-invalid="!formData.name && currentStepIndex === 0">
              <FieldLabel>项目名称 <span class="text-destructive">*</span></FieldLabel>
              <Input
                v-model="formData.name"
                placeholder="请输入项目名称"
                @update:model-value="updateField('name', $event)"
              />
              <FieldError v-if="!formData.name && currentStepIndex === 0">项目名称不能为空</FieldError>
            </Field>

            <Field>
              <FieldLabel>项目标识（自动生成）</FieldLabel>
              <Input
                :model-value="projectKeyValidation.value.value"
                disabled
                class="bg-muted/50"
              />
              <p class="text-xs text-muted-foreground mt-1">根据项目名称自动生成，创建后不可修改</p>
            </Field>

            <Field>
              <FieldLabel>项目描述</FieldLabel>
              <Textarea
                :model-value="formData.description as string"
                placeholder="请输入项目描述（可选）"
                rows="3"
                @update:model-value="updateField('description', $event)"
              />
            </Field>

            <Field>
              <FieldLabel>业务领域</FieldLabel>
              <Input
                :model-value="formData.businessDomain as string"
                placeholder="例如：电商、金融、医疗"
                @update:model-value="updateField('businessDomain', $event)"
              />
            </Field>
          </CardContent>
        </Card>

        <Card v-show="currentStepIndex === 1">
          <CardHeader>
            <CardTitle>{{ currentStep?.title }}</CardTitle>
            <CardDescription>{{ currentStep?.description }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <Field>
              <FieldLabel>系统类型 <span class="text-destructive">*</span></FieldLabel>
              <Select
                :model-value="formData.systemType as string"
                @update:model-value="updateField('systemType', $event)"
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择系统类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ECOMMERCE">电商系统</SelectItem>
                  <SelectItem value="CMS">内容管理系统</SelectItem>
                  <SelectItem value="ERP">企业资源计划</SelectItem>
                  <SelectItem value="CRM">客户关系管理</SelectItem>
                  <SelectItem value="OA">办公自动化</SelectItem>
                  <SelectItem value="LMS">学习管理系统</SelectItem>
                  <SelectItem value="MES">制造执行系统</SelectItem>
                  <SelectItem value="SCM">供应链管理</SelectItem>
                  <SelectItem value="HEALTHCARE">医疗健康系统</SelectItem>
                  <SelectItem value="FINTECH">金融科技</SelectItem>
                  <SelectItem value="IOT">物联网平台</SelectItem>
                  <SelectItem value="GAMING">游戏平台</SelectItem>
                  <SelectItem value="SOCIAL">社交平台</SelectItem>
                  <SelectItem value="EDUCATION">在线教育</SelectItem>
                  <SelectItem value="CUSTOM">定制开发</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>目标用户</FieldLabel>
              <Input
                :model-value="formData.targetAudience as string"
                placeholder="请描述目标用户群体"
                @update:model-value="updateField('targetAudience', $event)"
              />
            </Field>
          </CardContent>
        </Card>

        <Card v-show="currentStepIndex === 2">
          <CardHeader>
            <CardTitle>{{ currentStep?.title }}</CardTitle>
            <CardDescription>{{ currentStep?.description }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <Field>
              <FieldLabel>架构类型 <span class="text-destructive">*</span></FieldLabel>
              <Select
                :model-value="formData.architectureType as string"
                @update:model-value="updateField('architectureType', $event)"
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择架构类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONOLITHIC">单体架构</SelectItem>
                  <SelectItem value="MICROSERVICE">微服务架构</SelectItem>
                  <SelectItem value="SERVERLESS">无服务器架构</SelectItem>
                  <SelectItem value="MICROSERVICE_MONO_REPO">微服务单体仓库</SelectItem>
                  <SelectItem value="MODULAR_MONOLITH">模块化单体</SelectItem>
                  <SelectItem value="EVENT_DRIVEN">事件驱动架构</SelectItem>
                  <SelectItem value="LAYERED">分层架构</SelectItem>
                  <SelectItem value="HEXAGONAL">六边形架构</SelectItem>
                  <SelectItem value="DDD">领域驱动设计</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <div class="flex items-center gap-3">
                <Switch
                  :model-value="formData.isMicroservices as boolean"
                  @update:model-value="updateField('isMicroservices', $event)"
                />
                <FieldLabel class="!mb-0">是否采用微服务架构</FieldLabel>
              </div>
            </Field>
          </CardContent>
        </Card>

        <Card v-show="currentStepIndex === 3">
          <CardHeader>
            <CardTitle>{{ currentStep?.title }}</CardTitle>
            <CardDescription>{{ currentStep?.description }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <Field>
              <FieldLabel>前端框架</FieldLabel>
              <Select
                :model-value="formData.frontendFramework as string"
                @update:model-value="updateField('frontendFramework', $event)"
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择前端框架" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vue3">Vue 3</SelectItem>
                  <SelectItem value="React">React</SelectItem>
                  <SelectItem value="Angular">Angular</SelectItem>
                  <SelectItem value="Svelte">Svelte</SelectItem>
                  <SelectItem value="Next.js">Next.js</SelectItem>
                  <SelectItem value="Nuxt">Nuxt</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>后端框架</FieldLabel>
              <Select
                :model-value="formData.backendFramework as string"
                @update:model-value="updateField('backendFramework', $event)"
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择后端框架" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NestJS">NestJS</SelectItem>
                  <SelectItem value="Express">Express</SelectItem>
                  <SelectItem value="Fastify">Fastify</SelectItem>
                  <SelectItem value="Spring Boot">Spring Boot</SelectItem>
                  <SelectItem value="Django">Django</SelectItem>
                  <SelectItem value="Gin">Gin</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>编程语言</FieldLabel>
              <Select
                :model-value="formData.backendLanguage as string"
                @update:model-value="updateField('backendLanguage', $event)"
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择编程语言" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TypeScript">TypeScript</SelectItem>
                  <SelectItem value="JavaScript">JavaScript</SelectItem>
                  <SelectItem value="Java">Java</SelectItem>
                  <SelectItem value="Python">Python</SelectItem>
                  <SelectItem value="Go">Go</SelectItem>
                  <SelectItem value="Rust">Rust</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card v-show="currentStepIndex === 4">
          <CardHeader>
            <CardTitle>{{ currentStep?.title }}</CardTitle>
            <CardDescription>{{ currentStep?.description }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <Field>
              <FieldLabel>数据库类型 <span class="text-destructive">*</span></FieldLabel>
              <div class="flex flex-wrap gap-3">
                <div class="flex items-center space-x-2">
                  <Checkbox
                    id="POSTGRESQL"
                    :checked="(formData.databaseTypes as string[])?.includes('POSTGRESQL')"
                    @update:checked="(checked: boolean) => {
                      const types = [...(formData.databaseTypes as string[] || [])];
                      if (checked) types.push('POSTGRESQL');
                      else {
                        const idx = types.indexOf('POSTGRESQL');
                        if (idx > -1) types.splice(idx, 1);
                      }
                      updateField('databaseTypes', types);
                    }"
                  />
                  <label for="POSTGRESQL" class="text-sm">PostgreSQL</label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox
                    id="MYSQL"
                    :checked="(formData.databaseTypes as string[])?.includes('MYSQL')"
                    @update:checked="(checked: boolean) => {
                      const types = [...(formData.databaseTypes as string[] || [])];
                      if (checked) types.push('MYSQL');
                      else {
                        const idx = types.indexOf('MYSQL');
                        if (idx > -1) types.splice(idx, 1);
                      }
                      updateField('databaseTypes', types);
                    }"
                  />
                  <label for="MYSQL" class="text-sm">MySQL</label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox
                    id="MONGODB"
                    :checked="(formData.databaseTypes as string[])?.includes('MONGODB')"
                    @update:checked="(checked: boolean) => {
                      const types = [...(formData.databaseTypes as string[] || [])];
                      if (checked) types.push('MONGODB');
                      else {
                        const idx = types.indexOf('MONGODB');
                        if (idx > -1) types.splice(idx, 1);
                      }
                      updateField('databaseTypes', types);
                    }"
                  />
                  <label for="MONGODB" class="text-sm">MongoDB</label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox
                    id="REDIS"
                    :checked="(formData.databaseTypes as string[])?.includes('REDIS')"
                    @update:checked="(checked: boolean) => {
                      const types = [...(formData.databaseTypes as string[] || [])];
                      if (checked) types.push('REDIS');
                      else {
                        const idx = types.indexOf('REDIS');
                        if (idx > -1) types.splice(idx, 1);
                      }
                      updateField('databaseTypes', types);
                    }"
                  />
                  <label for="REDIS" class="text-sm">Redis</label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox
                    id="ELASTICSEARCH"
                    :checked="(formData.databaseTypes as string[])?.includes('ELASTICSEARCH')"
                    @update:checked="(checked: boolean) => {
                      const types = [...(formData.databaseTypes as string[] || [])];
                      if (checked) types.push('ELASTICSEARCH');
                      else {
                        const idx = types.indexOf('ELASTICSEARCH');
                        if (idx > -1) types.splice(idx, 1);
                      }
                      updateField('databaseTypes', types);
                    }"
                  />
                  <label for="ELASTICSEARCH" class="text-sm">Elasticsearch</label>
                </div>
              </div>
            </Field>

            <Field>
              <FieldLabel>ORM 框架</FieldLabel>
              <Select
                :model-value="formData.backendOrm as string"
                @update:model-value="updateField('backendOrm', $event)"
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择 ORM 框架" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TypeORM">TypeORM</SelectItem>
                  <SelectItem value="Prisma">Prisma</SelectItem>
                  <SelectItem value="Sequelize">Sequelize</SelectItem>
                  <SelectItem value="Drizzle">Drizzle</SelectItem>
                  <SelectItem value="None">不使用 ORM</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card v-show="currentStepIndex === 5">
          <CardHeader>
            <CardTitle>{{ currentStep?.title }}</CardTitle>
            <CardDescription>{{ currentStep?.description }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <Field>
              <FieldLabel>云服务商</FieldLabel>
              <Select
                :model-value="formData.cloudProvider as string"
                @update:model-value="updateField('cloudProvider', $event)"
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择云服务商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALIYUN">阿里云</SelectItem>
                  <SelectItem value="TENCENT">腾讯云</SelectItem>
                  <SelectItem value="HUAWEI">华为云</SelectItem>
                  <SelectItem value="AWS">亚马逊云 AWS</SelectItem>
                  <SelectItem value="GCP">谷歌云 GCP</SelectItem>
                  <SelectItem value="AZURE">微软云 Azure</SelectItem>
                  <SelectItem value="SELF_HOSTED">自托管</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>安全等级</FieldLabel>
              <Select
                :model-value="formData.securityLevel as string"
                @update:model-value="updateField('securityLevel', $event)"
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择安全等级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">基础安全</SelectItem>
                  <SelectItem value="STANDARD">标准安全</SelectItem>
                  <SelectItem value="ENHANCED">增强安全</SelectItem>
                  <SelectItem value="HIGH">高级安全（金融/医疗）</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card v-show="currentStepIndex === 6">
          <CardHeader>
            <CardTitle>{{ currentStep?.title }}</CardTitle>
            <CardDescription>{{ currentStep?.description }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <Field>
              <FieldLabel>项目规模 <span class="text-destructive">*</span></FieldLabel>
              <Select
                :model-value="formData.projectScale as string"
                @update:model-value="updateField('projectScale', $event)"
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择项目规模" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMALL">小型 (&lt; 10人)</SelectItem>
                  <SelectItem value="MEDIUM">中型 (10-50人)</SelectItem>
                  <SelectItem value="LARGE">大型 (50-200人)</SelectItem>
                  <SelectItem value="ENTERPRISE">企业级 (&gt; 200人)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>团队人数</FieldLabel>
              <Input
                type="number"
                :model-value="formData.teamSize as number"
                min="1"
                max="10000"
                placeholder="请输入团队人数"
                @update:model-value="updateField('teamSize', Number($event))"
              />
            </Field>

            <Field>
              <FieldLabel>预计开发周期（月）</FieldLabel>
              <Input
                type="number"
                :model-value="formData.expectedDurationMonths as number"
                min="1"
                max="120"
                placeholder="请输入预计周期"
                @update:model-value="updateField('expectedDurationMonths', Number($event))"
              />
            </Field>

            <Field>
              <FieldLabel>预算（万元）</FieldLabel>
              <Input
                type="number"
                :model-value="formData.budget as number"
                min="0"
                placeholder="请输入预算"
                @update:model-value="updateField('budget', Number($event))"
              />
            </Field>
          </CardContent>
        </Card>

        <Card v-show="currentStepIndex === 7">
          <CardHeader>
            <CardTitle>{{ currentStep?.title }}</CardTitle>
            <CardDescription>{{ currentStep?.description }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="rounded-lg border bg-muted/50 p-6 space-y-4">
              <div class="flex items-center justify-between pb-4 border-b">
                <span class="text-muted-foreground">项目名称</span>
                <span class="font-medium">{{ formData.name || '未填写' }}</span>
              </div>
              <div class="flex items-center justify-between pb-4 border-b">
                <span class="text-muted-foreground">项目标识</span>
                <code class="px-2 py-1 bg-background rounded text-sm font-mono">
                  {{ projectKeyValidation.value.value }}
                </code>
              </div>
              <div class="flex items-center justify-between pb-4 border-b">
                <span class="text-muted-foreground">系统类型</span>
                <span>{{ formData.systemType || '未选择' }}</span>
              </div>
              <div class="flex items-center justify-between pb-4 border-b">
                <span class="text-muted-foreground">架构类型</span>
                <span>{{ formData.architectureType || '未选择' }}</span>
              </div>
              <div class="flex items-center justify-between pb-4 border-b">
                <span class="text-muted-foreground">数据库</span>
                <span>{{ (formData.databaseTypes as string[])?.join(', ') || '未选择' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">项目规模</span>
                <span>{{ formData.projectScale || '未选择' }}</span>
              </div>
            </div>

            <TechStackCard
              v-if="techStackSuggestion"
              :tech-stack="techStackSuggestion"
              :is-loading="isLoadingSuggestion"
              @apply="applyTechStack"
            />
          </CardContent>
        </Card>
      </div>

      <div class="flex justify-between gap-4 pt-6 mt-6 border-t">
        <Button
          variant="outline"
          @click="isFirstStep ? handleCancel() : prevStep()"
        >
          <ArrowLeft v-if="!isFirstStep" class="h-4 w-4 mr-1" />
          {{ isFirstStep ? '取消' : '上一步' }}
        </Button>

        <Button
          v-if="!isLastStep"
          :disabled="!canProceed"
          @click="nextStep"
        >
          下一步
          <ArrowRight class="h-4 w-4 ml-1" />
        </Button>
        <Button
          v-else
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-1 animate-spin" />
          {{ isSubmitting ? '创建中...' : '确认创建' }}
        </Button>
      </div>
    </template>
  </div>
</template>
