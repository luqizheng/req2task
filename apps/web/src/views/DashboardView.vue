<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-slate-800 mb-8">Dashboard</h1>
      
      <div class="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>项目数</CardTitle>
            <CardDescription>当前活跃项目</CardDescription>
          </CardHeader>
          <CardContent class="text-3xl font-bold">0</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>需求数</CardTitle>
            <CardDescription>待处理需求</CardDescription>
          </CardHeader>
          <CardContent class="text-3xl font-bold">0</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>任务数</CardTitle>
            <CardDescription>进行中任务</CardDescription>
          </CardHeader>
          <CardContent class="text-3xl font-bold">0</CardContent>
        </Card>
      </div>

      <div class="text-center">
        <RouterLink to="/login">
          <Button variant="outline" @click="$router.push('/login')">退出登录</Button>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
