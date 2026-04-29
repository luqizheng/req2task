<script setup lang="ts">
import CommonCard from './CommonCard.vue'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-vue-next'
import { CardAction } from '@/components/ui/card'
import { CardDescription } from '@/components/ui/card'
</script>

<template>
  <div class="space-y-6">
    <!-- Basic Card with only title -->
    <CommonCard title="Basic Card">
      <p>这是一个基本的卡片，只包含标题和内容。</p>
    </CommonCard>

    <!-- Card with title and icon -->
    <CommonCard title="Card with Icon">
      <template #title-icon>
        <Settings class="h-5 w-5" />
      </template>
      <p>这是一个带有标题图标和内容的卡片。</p>
    </CommonCard>

    <!-- Card with title, description -->
    <CommonCard title="Card with Description" description="这是卡片的描述信息">
      <p>这是一个带有标题和描述的卡片。</p>
    </CommonCard>

    <!-- Card with title, icon and actions -->
    <CommonCard title="Card with Actions">
      <template #title-icon>
        <Settings class="h-5 w-5" />
      </template>
      <template #actions>
        <Button variant="link">操作</Button>
      </template>
      <p>这是一个带有标题图标、操作按钮和主体内容的卡片。</p>
    </CommonCard>

    <!-- Card matching shadcn official example -->
    <CommonCard>
      <template #header>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
        <CardAction>
          <Button variant="link">
            Sign Up
          </Button>
        </CardAction>
      </template>
      <p>这是与 shadcn 官网例子结构一致的卡片。</p>
    </CommonCard>

    <!-- Card with custom content slot -->
    <CommonCard title="Card with Custom Content">
      <template #content>
        <div class="p-6 bg-muted rounded-lg">
          <p>这是自定义的内容区域，使用了 content slot。</p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button size="sm">取消</Button>
          <Button size="sm" variant="default">确定</Button>
        </div>
      </template>
    </CommonCard>
  </div>
</template>