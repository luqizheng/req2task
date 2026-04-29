<script setup lang="ts">
import { ref } from 'vue'
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
</script>

<template>
  <div class="flex-1 max-w-md">
    <Input
      v-model="searchQuery"
      type="search"
      placeholder="全局搜索..."
      class="w-full"
    />
  </div>

  <div class="flex items-center gap-4">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Avatar class="h-9 w-9">
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
        <DropdownMenuItem @click="userStore.logout()">
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
