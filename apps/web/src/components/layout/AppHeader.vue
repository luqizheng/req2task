<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import AppBreadcrumb from './AppBreadcrumb.vue'

const router = useRouter()
const userStore = useUserStore()
const searchQuery = ref('')

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex w-full items-center justify-between gap-4">
    <AppBreadcrumb />

    <div class="flex items-center gap-4">
      <div class="hidden w-64 md:block">
        <Input
          v-model="searchQuery"
          type="search"
          placeholder="全局搜索..."
          class="w-full"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Avatar class="h-9 w-9 cursor-pointer">
            <AvatarFallback class="bg-primary text-primary-foreground">
              {{ getInitials(userStore.userInfo?.displayName || 'User') }}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56" align="end">
          <DropdownMenuLabel>
            <div class="flex flex-col space-y-1">
              <p class="text-sm font-medium leading-none">
                {{ userStore.userInfo?.displayName || '用户' }}
              </p>
              <p class="text-xs leading-none text-muted-foreground">
                {{ userStore.userInfo?.email || '' }}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>个人中心</DropdownMenuItem>
          <DropdownMenuItem>账号设置</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleLogout">
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>
