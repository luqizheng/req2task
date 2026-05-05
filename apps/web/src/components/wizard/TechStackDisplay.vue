<script setup lang="ts">
import { computed, ref } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Globe, Server } from 'lucide-vue-next';
import type { TechStackDto } from '@req2task/dto';

const props = defineProps<{
  techStack: TechStackDto | null;
}>();

const isExpanded = ref(false);

const frontendItems = computed(() => {
  if (!props.techStack?.frontend) return [];
  const items: string[] = [];
  if (props.techStack.frontend.language) items.push(`语言: ${props.techStack.frontend.language}`);
  if (props.techStack.frontend.framework) items.push(`框架: ${props.techStack.frontend.framework}`);
  if (props.techStack.frontend.uiLibrary) items.push(`UI 库: ${props.techStack.frontend.uiLibrary}`);
  if (props.techStack.frontend.stateManagement) items.push(`状态管理: ${props.techStack.frontend.stateManagement}`);
  if (props.techStack.frontend.buildTool) items.push(`构建工具: ${props.techStack.frontend.buildTool}`);
  if (props.techStack.frontend.otherTechnologies?.length) {
    props.techStack.frontend.otherTechnologies.forEach(tech => items.push(tech));
  }
  return items;
});

const backendItems = computed(() => {
  if (!props.techStack?.backend) return [];
  const items: string[] = [];
  if (props.techStack.backend.language) items.push(`语言: ${props.techStack.backend.language}`);
  if (props.techStack.backend.framework) items.push(`框架: ${props.techStack.backend.framework}`);
  if (props.techStack.backend.orm) items.push(`ORM: ${props.techStack.backend.orm}`);
  if (props.techStack.backend.apiStyle) items.push(`API 风格: ${props.techStack.backend.apiStyle}`);
  if (props.techStack.backend.caching?.length) items.push(`缓存: ${props.techStack.backend.caching.join(', ')}`);
  if (props.techStack.backend.messageQueue?.length) items.push(`消息队列: ${props.techStack.backend.messageQueue.join(', ')}`);
  if (props.techStack.backend.otherTechnologies?.length) {
    props.techStack.backend.otherTechnologies.forEach(tech => items.push(tech));
  }
  return items;
});

const infraItems = computed(() => {
  if (!props.techStack?.infrastructure) return [];
  const items: string[] = [];
  if (props.techStack.infrastructure.container) items.push(`容器: ${props.techStack.infrastructure.container}`);
  if (props.techStack.infrastructure.orchestration) items.push(`编排: ${props.techStack.infrastructure.orchestration}`);
  if (props.techStack.infrastructure.reverseProxy) items.push(`反向代理: ${props.techStack.infrastructure.reverseProxy}`);
  if (props.techStack.infrastructure.loadBalancer) items.push(`负载均衡: ${props.techStack.infrastructure.loadBalancer}`);
  return items;
});

const devopsItems = computed(() => {
  if (!props.techStack?.devops) return [];
  const items: string[] = [];
  if (props.techStack.devops.ciCd) items.push(`CI/CD: ${props.techStack.devops.ciCd}`);
  if (props.techStack.devops.containerRegistry) items.push(`镜像仓库: ${props.techStack.devops.containerRegistry}`);
  if (props.techStack.devops.monitoring?.length) items.push(`监控: ${props.techStack.devops.monitoring.join(', ')}`);
  if (props.techStack.devops.logging?.length) items.push(`日志: ${props.techStack.devops.logging.join(', ')}`);
  if (props.techStack.devops.tracing) items.push(`追踪: ${props.techStack.devops.tracing}`);
  return items;
});

const visibleSections = computed(() => {
  const sections = [];
  if (frontendItems.value.length) sections.push({ title: '前端技术', icon: Globe, items: frontendItems.value });
  if (backendItems.value.length) sections.push({ title: '后端技术', icon: Server, items: backendItems.value });
  if (infraItems.value.length && isExpanded.value) sections.push({ title: '基础设施', icon: '🏗️', items: infraItems.value });
  if (devopsItems.value.length && isExpanded.value) sections.push({ title: 'DevOps', icon: '🚀', items: devopsItems.value });
  return sections;
});

const hasContent = computed(() => {
  return frontendItems.value.length || backendItems.value.length || infraItems.value.length || devopsItems.value.length;
});
</script>

<template>
  <Card class="border-slate-200">
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <CardTitle class="text-base flex items-center gap-2">
          <span class="text-lg">🛠️</span>
          技术栈配置
        </CardTitle>
        <Button
          v-if="infraItems.length || devopsItems.length"
          variant="ghost"
          size="sm"
          class="h-8"
          @click="isExpanded = !isExpanded"
        >
          <component :is="isExpanded ? ChevronUp : ChevronDown" class="h-4 w-4 mr-1" />
          {{ isExpanded ? '收起' : '展开' }}
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <template v-if="hasContent">
        <div class="grid grid-cols-2 gap-6">
          <div v-for="section in visibleSections" :key="section.title" class="space-y-2">
            <h4 class="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
              <component :is="section.icon" v-if="typeof section.icon !== 'string'" class="w-4 h-4" />
              <span v-else>{{ section.icon }}</span>
              {{ section.title }}
            </h4>
            <div class="flex flex-wrap gap-1.5">
              <Badge
                v-for="item in section.items"
                :key="item"
                variant="secondary"
                class="font-normal"
              >
                {{ item }}
              </Badge>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <p class="text-sm text-muted-foreground text-center py-4">
          暂无技术栈配置
        </p>
      </template>
    </CardContent>
  </Card>
</template>
