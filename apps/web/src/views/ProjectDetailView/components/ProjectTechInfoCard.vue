<script setup lang="ts">
import { computed } from 'vue';
import type { ProjectResponseDto } from '@req2task/dto';
import {
  SystemType,
  ArchitectureType,
  CloudProvider,
  SecurityLevel,
  ProjectScale,
} from '@req2task/dto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  Cloud,
  Database,
  Shield,
  Users,
  Clock,
  Code,
} from 'lucide-vue-next';
import TechStackDisplay from '@/components/wizard/TechStackDisplay.vue';

defineProps<{
  project: ProjectResponseDto;
}>();

const systemTypeLabels: Record<SystemType, string> = {
  [SystemType.ECOMMERCE]: '电商系统',
  [SystemType.CMS]: '内容管理系统',
  [SystemType.ERP]: '企业资源计划',
  [SystemType.CRM]: '客户关系管理',
  [SystemType.OA]: '办公自动化',
  [SystemType.LMS]: '学习管理系统',
  [SystemType.MES]: '制造执行系统',
  [SystemType.SCM]: '供应链管理',
  [SystemType.HEALTHCARE]: '医疗健康系统',
  [SystemType.FINTECH]: '金融科技',
  [SystemType.IOT]: '物联网平台',
  [SystemType.GAMING]: '游戏平台',
  [SystemType.SOCIAL]: '社交平台',
  [SystemType.EDUCATION]: '在线教育',
  [SystemType.CUSTOM]: '定制开发',
};

const architectureTypeLabels: Record<ArchitectureType, string> = {
  [ArchitectureType.MONOLITHIC]: '单体架构',
  [ArchitectureType.MICROSERVICE]: '微服务架构',
  [ArchitectureType.SERVERLESS]: '无服务器架构',
  [ArchitectureType.MICROSERVICE_MONO_REPO]: '微服务单体仓库',
  [ArchitectureType.MODULAR_MONOLITH]: '模块化单体',
  [ArchitectureType.EVENT_DRIVEN]: '事件驱动架构',
  [ArchitectureType.LAYERED]: '分层架构',
  [ArchitectureType.HEXAGONAL]: '六边形架构',
  [ArchitectureType.DDD]: '领域驱动设计',
};

const cloudProviderLabels: Record<CloudProvider, string> = {
  [CloudProvider.ALIYUN]: '阿里云',
  [CloudProvider.TENCENT]: '腾讯云',
  [CloudProvider.HUAWEI]: '华为云',
  [CloudProvider.AWS]: 'AWS',
  [CloudProvider.GCP]: 'GCP',
  [CloudProvider.AZURE]: 'Azure',
  [CloudProvider.SELF_HOSTED]: '自托管',
};

const securityLevelLabels: Record<SecurityLevel, string> = {
  [SecurityLevel.BASIC]: '基础安全',
  [SecurityLevel.STANDARD]: '标准安全',
  [SecurityLevel.ENHANCED]: '增强安全',
  [SecurityLevel.HIGH]: '高级安全',
};

const projectScaleLabels: Record<ProjectScale, string> = {
  [ProjectScale.SMALL]: '小型 (< 10人)',
  [ProjectScale.MEDIUM]: '中型 (10-50人)',
  [ProjectScale.LARGE]: '大型 (50-200人)',
  [ProjectScale.ENTERPRISE]: '企业级 (> 200人)',
};

const hasTechInfo = computed(() => {
  return (
    props.project.systemType ||
    props.project.architectureType ||
    props.project.databaseTypes?.length ||
    props.project.cloudProvider ||
    props.project.securityLevel ||
    props.project.projectScale ||
    props.project.techStack
  );
});

const props = { project: {} } as any;
</script>

<template>
  <Card v-if="hasTechInfo" class="border-slate-200 shadow-sm">
    <CardHeader class="pb-4 border-b border-slate-100 bg-slate-50/50">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
          <Code class="w-4 h-4 text-purple-600" />
        </div>
        <CardTitle class="text-slate-800">技术配置</CardTitle>
      </div>
    </CardHeader>
    <CardContent class="p-6 space-y-5">
      <div class="grid grid-cols-2 gap-4">
        <div v-if="project.systemType" class="space-y-1.5">
          <label class="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers class="w-3.5 h-3.5" />
            系统类型
          </label>
          <Badge variant="secondary">
            {{ systemTypeLabels[project.systemType] || project.systemType }}
          </Badge>
        </div>

        <div v-if="project.architectureType" class="space-y-1.5">
          <label class="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers class="w-3.5 h-3.5" />
            架构类型
          </label>
          <Badge variant="secondary">
            {{ architectureTypeLabels[project.architectureType] || project.architectureType }}
          </Badge>
        </div>

        <div v-if="project.cloudProvider" class="space-y-1.5">
          <label class="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Cloud class="w-3.5 h-3.5" />
            云服务商
          </label>
          <Badge variant="secondary">
            {{ cloudProviderLabels[project.cloudProvider] || project.cloudProvider }}
          </Badge>
        </div>

        <div v-if="project.securityLevel" class="space-y-1.5">
          <label class="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield class="w-3.5 h-3.5" />
            安全等级
          </label>
          <Badge variant="secondary">
            {{ securityLevelLabels[project.securityLevel] || project.securityLevel }}
          </Badge>
        </div>

        <div v-if="project.projectScale" class="space-y-1.5">
          <label class="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users class="w-3.5 h-3.5" />
            项目规模
          </label>
          <Badge variant="secondary">
            {{ projectScaleLabels[project.projectScale] || project.projectScale }}
          </Badge>
        </div>

        <div v-if="project.teamSize" class="space-y-1.5">
          <label class="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users class="w-3.5 h-3.5" />
            团队人数
          </label>
          <p class="text-sm font-medium text-slate-700">{{ project.teamSize }} 人</p>
        </div>

        <div v-if="project.expectedDurationMonths" class="space-y-1.5">
          <label class="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock class="w-3.5 h-3.5" />
            预计周期
          </label>
          <p class="text-sm font-medium text-slate-700">{{ project.expectedDurationMonths }} 个月</p>
        </div>

        <div v-if="project.databaseTypes?.length" class="space-y-1.5 col-span-2">
          <label class="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Database class="w-3.5 h-3.5" />
            数据库
          </label>
          <div class="flex flex-wrap gap-1.5">
            <Badge
              v-for="db in project.databaseTypes"
              :key="db"
              variant="secondary"
            >
              {{ db }}
            </Badge>
          </div>
        </div>
      </div>

      <TechStackDisplay v-if="project.techStack" :tech-stack="project.techStack" />
    </CardContent>
  </Card>
</template>
