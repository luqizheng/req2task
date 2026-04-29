<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">设置</h1>
      <p class="text-sm text-muted-foreground">管理您的账号和偏好设置</p>
    </div>

    <div class="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>个人信息</CardTitle>
          <CardDescription>更新您的账号信息</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">个人信息设置页面（开发中）</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>偏好设置</CardTitle>
          <CardDescription>自定义您的使用体验</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">偏好设置页面（开发中）</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
