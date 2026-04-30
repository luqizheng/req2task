<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { Home, FolderKanban, FileText, LayoutDashboard, BookOpen, Settings, Command, Brain } from 'lucide-vue-next'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

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
  },
  {
    title: 'AI 配置',
    icon: Brain,
    path: '/ai/config',
    name: 'aiConfig'
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
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <RouterLink to="/dashboard">
              <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Command class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">需求转任务</span>
                <span class="truncate text-xs text-muted-foreground">Req2Task</span>
              </div>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>导航菜单</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in navItems" :key="item.name">
              <SidebarMenuButton as-child :is-active="isActive(item.name)">
                <RouterLink :to="item.path">
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem v-for="item in bottomItems" :key="item.name">
          <SidebarMenuButton as-child :is-active="isActive(item.name)">
            <RouterLink :to="item.path">
              <component :is="item.icon" />
              <span>{{ item.title }}</span>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
