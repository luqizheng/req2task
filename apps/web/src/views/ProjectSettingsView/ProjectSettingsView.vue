<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { projectsApi } from '@/api/projects';
import type { ProjectResponseDto } from '@req2task/dto';
import {
  SystemType,
  ArchitectureType,
  DatabaseType,
  CloudProvider,
  SecurityLevel,
  ProjectScale,
} from '@req2task/dto';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TechStackInput from '@/components/wizard/TechStackInput.vue';
import { toast } from 'vue-sonner';
import { Loader2, ArrowLeft, Save } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const projectId = route.params.id as string;

const project = ref<ProjectResponseDto | null>(null);
const loading = ref(true);
const isSaving = ref(false);

const formData = ref({
  name: '',
  description: '',
  systemType: '' as string,
  targetAudience: '',
  architectureType: '' as string,
  isMicroservices: false,
  frontendFramework: '',
  frontendLanguage: '',
  frontendTechs: [] as string[],
  backendFramework: '',
  backendLanguage: '',
  backendTechs: [] as string[],
  databaseTypes: [] as string[],
  backendOrm: '',
  cloudProvider: '' as string,
  securityLevel: '' as string,
  projectScale: '' as string,
  teamSize: undefined as number | undefined,
  expectedDurationMonths: undefined as number | undefined,
  budget: undefined as number | undefined,
  businessDomain: '',
});

const systemTypeOptions = [
  { value: SystemType.ECOMMERCE, label: '电商系统' },
  { value: SystemType.CMS, label: '内容管理系统' },
  { value: SystemType.ERP, label: '企业资源计划' },
  { value: SystemType.CRM, label: '客户关系管理' },
  { value: SystemType.OA, label: '办公自动化' },
  { value: SystemType.LMS, label: '学习管理系统' },
  { value: SystemType.MES, label: '制造执行系统' },
  { value: SystemType.SCM, label: '供应链管理' },
  { value: SystemType.HEALTHCARE, label: '医疗健康系统' },
  { value: SystemType.FINTECH, label: '金融科技' },
  { value: SystemType.IOT, label: '物联网平台' },
  { value: SystemType.GAMING, label: '游戏平台' },
  { value: SystemType.SOCIAL, label: '社交平台' },
  { value: SystemType.EDUCATION, label: '在线教育' },
  { value: SystemType.CUSTOM, label: '定制开发' },
];

const architectureTypeOptions = [
  { value: ArchitectureType.MONOLITHIC, label: '单体架构' },
  { value: ArchitectureType.MICROSERVICE, label: '微服务架构' },
  { value: ArchitectureType.SERVERLESS, label: '无服务器架构' },
  { value: ArchitectureType.MICROSERVICE_MONO_REPO, label: '微服务单体仓库' },
  { value: ArchitectureType.MODULAR_MONOLITH, label: '模块化单体' },
  { value: ArchitectureType.EVENT_DRIVEN, label: '事件驱动架构' },
  { value: ArchitectureType.LAYERED, label: '分层架构' },
  { value: ArchitectureType.HEXAGONAL, label: '六边形架构' },
  { value: ArchitectureType.DDD, label: '领域驱动设计' },
];

const cloudProviderOptions = [
  { value: CloudProvider.ALIYUN, label: '阿里云' },
  { value: CloudProvider.TENCENT, label: '腾讯云' },
  { value: CloudProvider.HUAWEI, label: '华为云' },
  { value: CloudProvider.AWS, label: 'AWS' },
  { value: CloudProvider.GCP, label: 'GCP' },
  { value: CloudProvider.AZURE, label: 'Azure' },
  { value: CloudProvider.SELF_HOSTED, label: '自托管' },
];

const securityLevelOptions = [
  { value: SecurityLevel.BASIC, label: '基础安全' },
  { value: SecurityLevel.STANDARD, label: '标准安全' },
  { value: SecurityLevel.ENHANCED, label: '增强安全' },
  { value: SecurityLevel.HIGH, label: '高级安全（金融/医疗）' },
];

const projectScaleOptions = [
  { value: ProjectScale.SMALL, label: '小型 (< 10人)' },
  { value: ProjectScale.MEDIUM, label: '中型 (10-50人)' },
  { value: ProjectScale.LARGE, label: '大型 (50-200人)' },
  { value: ProjectScale.ENTERPRISE, label: '企业级 (> 200人)' },
];

const databaseTypeOptions = [
  { value: DatabaseType.POSTGRESQL, label: 'PostgreSQL' },
  { value: DatabaseType.MYSQL, label: 'MySQL' },
  { value: DatabaseType.MONGODB, label: 'MongoDB' },
  { value: DatabaseType.REDIS, label: 'Redis' },
  { value: DatabaseType.ELASTICSEARCH, label: 'Elasticsearch' },
  { value: DatabaseType.MARIADB, label: 'MariaDB' },
  { value: DatabaseType.ORACLE, label: 'Oracle' },
  { value: DatabaseType.SQLSERVER, label: 'SQL Server' },
];

const frontendFrameworkOptions = [
  { value: 'Vue3', label: 'Vue 3' },
  { value: 'React', label: 'React' },
  { value: 'Angular', label: 'Angular' },
  { value: 'Svelte', label: 'Svelte' },
  { value: 'Next.js', label: 'Next.js' },
  { value: 'Nuxt', label: 'Nuxt' },
];

const backendFrameworkOptions = [
  { value: 'NestJS', label: 'NestJS' },
  { value: 'Express', label: 'Express' },
  { value: 'Fastify', label: 'Fastify' },
  { value: 'Spring Boot', label: 'Spring Boot' },
  { value: 'Django', label: 'Django' },
  { value: 'Gin', label: 'Gin' },
];

const languageOptions = [
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'Java', label: 'Java' },
  { value: 'Python', label: 'Python' },
  { value: 'Go', label: 'Go' },
  { value: 'Rust', label: 'Rust' },
];

const ormOptions = [
  { value: 'TypeORM', label: 'TypeORM' },
  { value: 'Prisma', label: 'Prisma' },
  { value: 'Sequelize', label: 'Sequelize' },
  { value: 'Drizzle', label: 'Drizzle' },
  { value: 'None', label: '不使用 ORM' },
];

async function loadProject() {
  try {
    loading.value = true;
    project.value = await projectsApi.getById(projectId);
    initFormData();
  } catch (error) {
    toast.error('加载项目失败');
    router.push(`/projects/${projectId}`);
  } finally {
    loading.value = false;
  }
}

function initFormData() {
  if (!project.value) return;

  formData.value = {
    name: project.value.name || '',
    description: project.value.description || '',
    systemType: project.value.systemType || '',
    targetAudience: project.value.targetAudience || '',
    architectureType: project.value.architectureType || '',
    isMicroservices: project.value.isMicroservices || false,
    frontendFramework: project.value.techStack?.frontend?.framework || '',
    frontendLanguage: project.value.techStack?.frontend?.language || '',
    frontendTechs: project.value.techStack?.frontend?.otherTechnologies || [],
    backendFramework: project.value.techStack?.backend?.framework || '',
    backendLanguage: project.value.techStack?.backend?.language || '',
    backendTechs: project.value.techStack?.backend?.otherTechnologies || [],
    databaseTypes: project.value.databaseTypes || [],
    backendOrm: project.value.techStack?.backend?.orm || '',
    cloudProvider: project.value.cloudProvider || '',
    securityLevel: project.value.securityLevel || '',
    projectScale: project.value.projectScale || '',
    teamSize: project.value.teamSize ?? undefined,
    expectedDurationMonths: project.value.expectedDurationMonths ?? undefined,
    budget: project.value.budget ?? undefined,
    businessDomain: project.value.businessDomain || '',
  };
}

async function handleSave() {
  if (!formData.value.name.trim()) {
    toast.error('项目名称不能为空');
    return;
  }

  isSaving.value = true;
  try {
    await projectsApi.update(projectId, {
      name: formData.value.name,
      description: formData.value.description || undefined,
    });

    toast.success('项目设置已保存');
    router.push(`/projects/${projectId}`);
  } catch (error: any) {
    toast.error(error?.message || '保存失败');
  } finally {
    isSaving.value = false;
  }
}

function handleCancel() {
  router.push(`/projects/${projectId}`);
}

onMounted(() => {
  loadProject();
});
</script>

<template>
  <div class="h-full overflow-auto bg-slate-50/50">
    <div class="max-w-4xl mx-auto p-6">
      <nav class="flex items-center gap-2 text-sm mb-6">
        <button
          class="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
          @click="handleCancel"
        >
          <ArrowLeft class="w-4 h-4" />
          返回项目
        </button>
        <span class="text-slate-300">/</span>
        <span class="text-slate-800 font-medium">项目设置</span>
      </nav>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
      </div>

      <template v-else-if="project">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-slate-900">项目设置</h1>
          <p class="text-muted-foreground mt-1">配置项目的基本信息和高级设置</p>
        </div>

        <Tabs default-value="basic" class="space-y-6">
          <TabsList class="h-12 bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
            <TabsTrigger
              value="basic"
              class="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 h-10 px-4 font-medium text-sm transition-all"
            >
              基础信息
            </TabsTrigger>
            <TabsTrigger
              value="tech"
              class="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 h-10 px-4 font-medium text-sm transition-all"
            >
              技术配置
            </TabsTrigger>
            <TabsTrigger
              value="scale"
              class="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 h-10 px-4 font-medium text-sm transition-all"
            >
              项目规模
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card class="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>基础信息</CardTitle>
                <CardDescription>项目的基本配置信息</CardDescription>
              </CardHeader>
              <CardContent class="space-y-6">
                <Field>
                  <FieldLabel>项目名称 <span class="text-destructive">*</span></FieldLabel>
                  <Input v-model="formData.name" placeholder="请输入项目名称" />
                </Field>

                <Field>
                  <FieldLabel>项目标识</FieldLabel>
                  <Input :model-value="project.projectKey" disabled class="bg-muted/50" />
                  <p class="text-xs text-muted-foreground mt-1">项目标识创建后不可修改</p>
                </Field>

                <Field>
                  <FieldLabel>项目描述</FieldLabel>
                  <Textarea v-model="formData.description" placeholder="请输入项目描述" rows="4" />
                </Field>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tech">
            <Card class="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>技术配置</CardTitle>
                <CardDescription>项目的技术栈和架构配置（这些字段需要通过向导创建）</CardDescription>
              </CardHeader>
              <CardContent class="space-y-6">
                <div class="grid grid-cols-2 gap-6">
                  <Field>
                    <FieldLabel>系统类型</FieldLabel>
                    <Select v-model="formData.systemType">
                      <SelectTrigger>
                        <SelectValue placeholder="请选择系统类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="opt in systemTypeOptions" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>架构类型</FieldLabel>
                    <Select v-model="formData.architectureType">
                      <SelectTrigger>
                        <SelectValue placeholder="请选择架构类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="opt in architectureTypeOptions" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div class="grid grid-cols-2 gap-6">
                  <Field>
                    <FieldLabel>前端框架</FieldLabel>
                    <Select v-model="formData.frontendFramework">
                      <SelectTrigger>
                        <SelectValue placeholder="请选择前端框架" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="opt in frontendFrameworkOptions" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>前端语言</FieldLabel>
                    <Select v-model="formData.frontendLanguage">
                      <SelectTrigger>
                        <SelectValue placeholder="请选择前端语言" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TypeScript">TypeScript</SelectItem>
                        <SelectItem value="JavaScript">JavaScript</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div class="grid grid-cols-2 gap-6">
                  <Field>
                    <FieldLabel>后端框架</FieldLabel>
                    <Select v-model="formData.backendFramework">
                      <SelectTrigger>
                        <SelectValue placeholder="请选择后端框架" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="opt in backendFrameworkOptions" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div class="grid grid-cols-2 gap-6">
                  <Field>
                    <FieldLabel>后端语言</FieldLabel>
                    <Select v-model="formData.backendLanguage">
                      <SelectTrigger>
                        <SelectValue placeholder="请选择编程语言" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="opt in languageOptions" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>ORM 框架</FieldLabel>
                    <Select v-model="formData.backendOrm">
                      <SelectTrigger>
                        <SelectValue placeholder="请选择 ORM 框架" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="opt in ormOptions" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <TechStackInput
                  :model-value="{
                    frontend: formData.frontendTechs,
                    backend: formData.backendTechs,
                  }"
                  @update:model-value="(val) => {
                    formData.frontendTechs = val.frontend;
                    formData.backendTechs = val.backend;
                  }"
                />

                <Field>
                  <FieldLabel>数据库类型</FieldLabel>
                  <div class="flex flex-wrap gap-3">
                    <div v-for="opt in databaseTypeOptions" :key="opt.value" class="flex items-center space-x-2">
                      <Checkbox
                        :id="`db-${opt.value}`"
                        :checked="formData.databaseTypes.includes(opt.value)"
                        @update:checked="(checked: boolean) => {
                          if (checked) {
                            formData.databaseTypes.push(opt.value);
                          } else {
                            const idx = formData.databaseTypes.indexOf(opt.value);
                            if (idx > -1) formData.databaseTypes.splice(idx, 1);
                          }
                        }"
                      />
                      <label :for="`db-${opt.value}`" class="text-sm">{{ opt.label }}</label>
                    </div>
                  </div>
                </Field>

                <div class="grid grid-cols-2 gap-6">
                  <Field>
                    <FieldLabel>云服务商</FieldLabel>
                    <Select v-model="formData.cloudProvider">
                      <SelectTrigger>
                        <SelectValue placeholder="请选择云服务商" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="opt in cloudProviderOptions" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>安全等级</FieldLabel>
                    <Select v-model="formData.securityLevel">
                      <SelectTrigger>
                        <SelectValue placeholder="请选择安全等级" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="opt in securityLevelOptions" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scale">
            <Card class="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>项目规模</CardTitle>
                <CardDescription>项目的规模和团队配置</CardDescription>
              </CardHeader>
              <CardContent class="space-y-6">
                <div class="grid grid-cols-2 gap-6">
                  <Field>
                    <FieldLabel>项目规模</FieldLabel>
                    <Select v-model="formData.projectScale">
                      <SelectTrigger>
                        <SelectValue placeholder="请选择项目规模" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="opt in projectScaleOptions" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>团队人数</FieldLabel>
                    <Input v-model.number="formData.teamSize" type="number" placeholder="请输入团队人数" min="1" />
                  </Field>
                </div>

                <div class="grid grid-cols-2 gap-6">
                  <Field>
                    <FieldLabel>预计开发周期（月）</FieldLabel>
                    <Input v-model.number="formData.expectedDurationMonths" type="number" placeholder="请输入预计周期" min="1" />
                  </Field>

                  <Field>
                    <FieldLabel>预算（万元）</FieldLabel>
                    <Input v-model.number="formData.budget" type="number" placeholder="请输入预算" min="0" />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>业务领域</FieldLabel>
                  <Input v-model="formData.businessDomain" placeholder="例如：电商、金融、医疗" />
                </Field>

                <Field>
                  <FieldLabel>目标用户</FieldLabel>
                  <Textarea v-model="formData.targetAudience" placeholder="请描述目标用户群体" rows="2" />
                </Field>

                <Field>
                  <div class="flex items-center gap-3">
                    <Switch v-model="formData.isMicroservices" />
                    <FieldLabel class="!mb-0">是否采用微服务架构</FieldLabel>
                  </div>
                </Field>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div class="flex justify-end gap-4 mt-6 pt-6 border-t">
          <Button variant="outline" @click="handleCancel">
            取消
          </Button>
          <Button :disabled="isSaving" @click="handleSave">
            <Loader2 v-if="isSaving" class="h-4 w-4 mr-2 animate-spin" />
            <Save v-else class="h-4 w-4 mr-2" />
            保存设置
          </Button>
        </div>
      </template>
    </div>
  </div>
</template>
