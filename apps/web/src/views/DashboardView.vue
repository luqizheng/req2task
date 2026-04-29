<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FolderKanban } from "lucide-vue-next";

const router = useRouter();
const userStore = useUserStore();

const handleLogout = () => {
  userStore.logout();
  router.push("/login");
};
</script>

<template>
  <div class="h-full p-8">
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
        <RouterLink to="/projects">
          <Button class="gap-2">
            <FolderKanban class="w-4 h-4" />
            查看项目
          </Button>
        </RouterLink>
        <Button variant="outline" class="ml-4" @click="handleLogout">
          退出登录
        </Button>
      </div>
    </div>
  </div>
</template>
