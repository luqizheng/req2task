<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { Home, FolderKanban, FileText, LayoutDashboard, BookOpen, Settings } from 'lucide-vue-next'

const route = useRoute()

const navItems = [
  {
    title: '首页',
    icon: Home,
    path: '/dashboard',
    name: 'dashboard'
  },
  {
    title: '项目列表',
    icon: FolderKanban,
    path: '/projects',
    name: 'projects'
  },
  {
    title: '需求管理',
    icon: FileText,
    path: '/requirements',
    name: 'requirements'
  },
  {
    title: '任务看板',
    icon: LayoutDashboard,
    path: '/tasks',
    name: 'tasks'
  },
  {
    title: '知识库',
    icon: BookOpen,
    path: '/knowledge',
    name: 'knowledge'
  }
]

const bottomItems = [
  {
    title: '设置',
    icon: Settings,
    path: '/settings',
    name: 'settings'
  }
]

const isActive = (name: string) => route.name === name
</script>

<template>
  <aside class="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
    <div class="p-4 border-b border-sidebar-border">
      <RouterLink to="/dashboard" class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <span class="text-sidebar-primary-foreground font-bold text-sm">R2T</span>
        </div>
        <span class="font-semibold text-sidebar-foreground">需求转任务</span>
      </RouterLink>
    </div>

    <nav class="flex-1 p-3 space-y-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isActive(item.name)
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5" />
        {{ item.title }}
      </RouterLink>
    </nav>

    <div class="p-3 border-t border-sidebar-border space-y-1">
      <RouterLink
        v-for="item in bottomItems"
        :key="item.name"
        :to="item.path"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isActive(item.name)
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5" />
        {{ item.title }}
      </RouterLink>
    </div>
  </aside>
</template>
