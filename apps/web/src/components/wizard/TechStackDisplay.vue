<script setup lang="ts">
import { computed, ref } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import type { TechStackDto } from '@req2task/dto';

const props = defineProps<{
  techStack: TechStackDto | null;
}>();

const isExpanded = ref(false);

const hasContent = computed(() => {
  return (
    props.techStack?.frontend ||
    props.techStack?.backend ||
    props.techStack?.infrastructure ||
    props.techStack?.devops
  );
});

const sections = computed(() => {
  if (!props.techStack) return [];

  const result = [];

  if (props.techStack.frontend) {
    const items = [
      props.techStack.frontend.framework && `框架: ${props.techStack.frontend.framework}`,
      props.techStack.frontend.uiLibrary && `UI 库: ${props.techStack.frontend.uiLibrary}`,
      props.techStack.frontend.stateManagement && `状态管理: ${props.techStack.frontend.stateManagement}`,
      props.techStack.frontend.buildTool && `构建工具: ${props.techStack.frontend.buildTool}`,
      props.techStack.frontend.language && `语言: ${props.techStack.frontend.language}`,
    ].filter(Boolean);
    if (items.length) result.push({ title: '前端', icon: '🌐', items });
  }

  if (props.techStack.backend) {
    const items = [
      props.techStack.backend.framework && `框架: ${props.techStack.backend.framework}`,
      props.techStack.backend.language && `语言: ${props.techStack.backend.language}`,
      props.techStack.backend.orm && `ORM: ${props.techStack.backend.orm}`,
      props.techStack.backend.apiStyle && `API 风格: ${props.techStack.backend.apiStyle}`,
      props.techStack.backend.caching?.length && `缓存: ${props.techStack.backend.caching.join(', ')}`,
      props.techStack.backend.messageQueue?.length && `消息队列: ${props.techStack.backend.messageQueue.join(', ')}`,
    ].filter(Boolean);
    if (items.length) result.push({ title: '后端', icon: '⚙️', items });
  }

  if (props.techStack.infrastructure) {
    const items = [
      props.techStack.infrastructure.container && `容器: ${props.techStack.infrastructure.container}`,
      props.techStack.infrastructure.orchestration && `编排: ${props.techStack.infrastructure.orchestration}`,
      props.techStack.infrastructure.reverseProxy && `反向代理: ${props.techStack.infrastructure.reverseProxy}`,
      props.techStack.infrastructure.loadBalancer && `负载均衡: ${props.techStack.infrastructure.loadBalancer}`,
    ].filter(Boolean);
    if (items.length) result.push({ title: '基础设施', icon: '🏗️', items });
  }

  if (props.techStack.devops) {
    const items = [
      props.techStack.devops.ciCd && `CI/CD: ${props.techStack.devops.ciCd}`,
      props.techStack.devops.containerRegistry && `镜像仓库: ${props.techStack.devops.containerRegistry}`,
      props.techStack.devops.monitoring?.length && `监控: ${props.techStack.devops.monitoring.join(', ')}`,
      props.techStack.devops.logging?.length && `日志: ${props.techStack.devops.logging.join(', ')}`,
      props.techStack.devops.tracing && `追踪: ${props.techStack.devops.tracing}`,
    ].filter(Boolean);
    if (items.length) result.push({ title: 'DevOps', icon: '🚀', items });
  }

  return result;
});

const visibleSections = computed(() => {
  if (isExpanded.value) return sections.value;
  return sections.value.slice(0, 2);
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
          v-if="sections.length > 2"
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
        <div class="space-y-4">
          <div
            v-for="section in visibleSections"
            :key="section.title"
            class="space-y-2"
          >
            <h4 class="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
              <span>{{ section.icon }}</span>
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
