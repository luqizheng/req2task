<script setup lang="ts">
import { computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-vue-next';
import type { TechStackDto } from '@req2task/dto';

const props = defineProps<{
  techStack: TechStackDto;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  'apply': [techStack: TechStackDto];
}>();

const sections = computed(() => {
  const result = [];

  if (props.techStack.frontend) {
    result.push({
      title: '前端',
      icon: '🌐',
      items: [
        props.techStack.frontend.language && `语言: ${props.techStack.frontend.language}`,
        props.techStack.frontend.framework && `框架: ${props.techStack.frontend.framework}`,
        props.techStack.frontend.uiLibrary && `UI 库: ${props.techStack.frontend.uiLibrary}`,
        props.techStack.frontend.stateManagement && `状态管理: ${props.techStack.frontend.stateManagement}`,
        props.techStack.frontend.buildTool && `构建工具: ${props.techStack.frontend.buildTool}`,
        props.techStack.frontend.otherTechnologies?.length && `其他: ${props.techStack.frontend.otherTechnologies.join(', ')}`,
      ].filter(Boolean),
    });
  }

  if (props.techStack.backend) {
    result.push({
      title: '后端',
      icon: '⚙️',
      items: [
        props.techStack.backend.language && `语言: ${props.techStack.backend.language}`,
        props.techStack.backend.framework && `框架: ${props.techStack.backend.framework}`,
        props.techStack.backend.orm && `ORM: ${props.techStack.backend.orm}`,
        props.techStack.backend.apiStyle && `API 风格: ${props.techStack.backend.apiStyle}`,
        props.techStack.backend.caching?.length && `缓存: ${props.techStack.backend.caching.join(', ')}`,
        props.techStack.backend.messageQueue?.length && `消息队列: ${props.techStack.backend.messageQueue.join(', ')}`,
        props.techStack.backend.otherTechnologies?.length && `其他: ${props.techStack.backend.otherTechnologies.join(', ')}`,
      ].filter(Boolean),
    });
  }

  if (props.techStack.infrastructure) {
    result.push({
      title: '基础设施',
      icon: '🏗️',
      items: [
        props.techStack.infrastructure.container && `容器: ${props.techStack.infrastructure.container}`,
        props.techStack.infrastructure.orchestration && `编排: ${props.techStack.infrastructure.orchestration}`,
        props.techStack.infrastructure.reverseProxy && `反向代理: ${props.techStack.infrastructure.reverseProxy}`,
        props.techStack.infrastructure.loadBalancer && `负载均衡: ${props.techStack.infrastructure.loadBalancer}`,
      ].filter(Boolean),
    });
  }

  if (props.techStack.devops) {
    result.push({
      title: 'DevOps',
      icon: '🚀',
      items: [
        props.techStack.devops.ciCd && `CI/CD: ${props.techStack.devops.ciCd}`,
        props.techStack.devops.containerRegistry && `镜像仓库: ${props.techStack.devops.containerRegistry}`,
        props.techStack.devops.monitoring?.length && `监控: ${props.techStack.devops.monitoring.join(', ')}`,
        props.techStack.devops.logging?.length && `日志: ${props.techStack.devops.logging.join(', ')}`,
        props.techStack.devops.tracing && `追踪: ${props.techStack.devops.tracing}`,
        props.techStack.devops.codeQuality?.length && `代码质量: ${props.techStack.devops.codeQuality.join(', ')}`,
      ].filter(Boolean),
    });
  }

  return result;
});

const handleApply = () => {
  emit('apply', props.techStack);
};
</script>

<template>
  <Card class="border-primary/20 bg-primary/5">
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <CardTitle class="text-lg flex items-center gap-2">
          <span class="text-xl">💡</span>
          推荐技术栈
        </CardTitle>
        <Button
          size="sm"
          :disabled="isLoading"
          @click="handleApply"
        >
          <Check v-if="!isLoading" class="h-4 w-4 mr-1" />
          一键应用
        </Button>
      </div>
    </CardHeader>
    <CardContent class="space-y-4">
      <div
        v-for="section in sections"
        :key="section.title"
        class="space-y-2"
      >
        <h4 class="text-sm font-semibold flex items-center gap-1.5">
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
    </CardContent>
  </Card>
</template>
