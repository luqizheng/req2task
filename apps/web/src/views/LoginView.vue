<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Wand2, User, Lock } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useUserStore } from '@/stores/user'
import { authApi } from '@/api'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const loginSchema = toTypedSchema(z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(6, '密码长度至少6位'),
  remember: z.boolean().optional()
}))

const { handleSubmit } = useForm({
  validationSchema: loginSchema,
  initialValues: {
    username: '',
    password: '',
    remember: false
  }
})

const { value: username, errorMessage: usernameError } = useField<string>('username')
const { value: password, errorMessage: passwordError } = useField<string>('password')
const { value: remember } = useField<boolean>('remember')

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  try {
    const response = await authApi.login({
       username: values.username,
       password: values.password
     })
     userStore.setToken(response.accessToken)
     userStore.setUserInfo(response.user)
    toast.success('登录成功')
    router.push('/dashboard')
  } catch (error) {
    toast.error('登录失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 relative overflow-hidden">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-60 blur-[80px]" />
      <div class="absolute bottom-[-150px] left-[-100px] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 opacity-50 blur-[80px]" />
      <div class="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-amber-500 to-red-500 opacity-25 blur-[80px]" />
    </div>

    <Card class="w-[420px] shadow-xl border-0">
      <CardHeader class="text-center space-y-4 pb-2">
        <div class="flex items-center justify-center gap-3">
          <div class="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <Wand2 class="w-8 h-8 text-white" />
          </div>
          <span class="text-3xl font-bold text-slate-800 tracking-tight">req2task</span>
        </div>
        <CardDescription class="text-slate-500">需求管理系统</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit="onSubmit">
          <div class="space-y-2">
            <Label for="username" class="text-slate-700">用户名</Label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="username"
                v-model="username"
                placeholder="请输入用户名"
                class="pl-10 h-11"
                :class="{ 'border-red-500': usernameError }"
              />
            </div>
            <p v-if="usernameError" class="text-sm text-red-500">{{ usernameError }}</p>
          </div>

          <div class="space-y-2">
            <Label for="password" class="text-slate-700">密码</Label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="password"
                v-model="password"
                type="password"
                placeholder="请输入密码"
                class="pl-10 h-11"
                :class="{ 'border-red-500': passwordError }"
              />
            </div>
            <p v-if="passwordError" class="text-sm text-red-500">{{ passwordError }}</p>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <Checkbox id="remember" v-model="remember" />
              <Label for="remember" class="text-sm text-slate-600 cursor-pointer">记住我</Label>
            </div>
            <Button variant="link" class="text-sm text-blue-600 hover:text-blue-700 p-0 h-auto">
              忘记密码？
            </Button>
          </div>

          <Button type="submit" class="w-full h-12 text-base font-medium" :disabled="loading">
            {{ loading ? '登录中...' : '登 录' }}
          </Button>
        </form>

        <div class="mt-6 text-center space-y-3">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-medium">
            <Wand2 class="w-3 h-3" />
            AI 智能辅助
          </div>
          <p class="text-sm text-slate-500">
            还没有账号？
            <Button variant="link" class="text-blue-600 hover:text-blue-700 p-0 h-auto text-sm">
              立即注册
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
