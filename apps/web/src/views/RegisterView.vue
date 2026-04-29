<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Wand2, User, Lock, Mail, UserCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const router = useRouter()
const loading = ref(false)

const registerSchema = toTypedSchema(z.object({
  username: z.string().min(3, '用户名长度为3-20个字符').max(20),
  email: z.string().email('请输入正确的邮箱格式'),
  displayName: z.string().optional(),
  password: z.string().min(6, '密码长度至少6位'),
  confirmPassword: z.string(),
  agree: z.boolean()
}).refine(data => data.password === data.confirmPassword, {
  message: '两次输入密码不一致',
  path: ['confirmPassword']
}))

const { values, errors, handleSubmit } = useForm({
  validationSchema: registerSchema,
  initialValues: {
    username: '',
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    agree: false
  }
})

const onSubmit = handleSubmit(async (values) => {
  if (!values.agree) {
    toast.warning('请先同意用户协议')
    return
  }
  
  loading.value = true
  try {
    console.log('注册:', values)
    toast.success('注册成功，请登录')
    router.push('/login')
  } catch (error) {
    toast.error('注册失败')
  } finally {
    loading.value = false
  }
})

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 relative overflow-hidden p-4">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-60 blur-[80px]" />
      <div class="absolute bottom-[-150px] left-[-100px] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 opacity-50 blur-[80px]" />
      <div class="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-amber-500 to-red-500 opacity-25 blur-[80px]" />
    </div>

    <Card class="w-full max-w-md shadow-xl border-0">
      <CardHeader class="text-center space-y-4 pb-2">
        <div class="flex items-center justify-center gap-3">
          <div class="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <Wand2 class="w-8 h-8 text-white" />
          </div>
          <span class="text-3xl font-bold text-slate-800 tracking-tight">req2task</span>
        </div>
        <CardDescription class="text-slate-500 text-lg">创建账号</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit="onSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="username" class="text-slate-700">用户名</Label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="username"
                v-model="values.username"
                placeholder="用户名（3-20个字符）"
                class="pl-10 h-11"
                :class="{ 'border-red-500': errors.username }"
              />
            </div>
            <p v-if="errors.username" class="text-sm text-red-500">{{ errors.username }}</p>
          </div>

          <div class="space-y-2">
            <Label for="email" class="text-slate-700">邮箱</Label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="email"
                v-model="values.email"
                type="email"
                placeholder="请输入邮箱"
                class="pl-10 h-11"
                :class="{ 'border-red-500': errors.email }"
              />
            </div>
            <p v-if="errors.email" class="text-sm text-red-500">{{ errors.email }}</p>
          </div>

          <div class="space-y-2">
            <Label for="displayName" class="text-slate-700">显示名称</Label>
            <div class="relative">
              <UserCircle class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="displayName"
                v-model="values.displayName"
                placeholder="显示名称（可选）"
                class="pl-10 h-11"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="password" class="text-slate-700">密码</Label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="password"
                v-model="values.password"
                type="password"
                placeholder="密码（至少6位）"
                class="pl-10 h-11"
                :class="{ 'border-red-500': errors.password }"
              />
            </div>
            <p v-if="errors.password" class="text-sm text-red-500">{{ errors.password }}</p>
          </div>

          <div class="space-y-2">
            <Label for="confirmPassword" class="text-slate-700">确认密码</Label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="confirmPassword"
                v-model="values.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                class="pl-10 h-11"
                :class="{ 'border-red-500': errors.confirmPassword }"
              />
            </div>
            <p v-if="errors.confirmPassword" class="text-sm text-red-500">{{ errors.confirmPassword }}</p>
          </div>

          <div class="flex items-start space-x-2">
            <Checkbox id="agree" v-model="values.agree" />
            <Label for="agree" class="text-sm text-slate-600 cursor-pointer leading-normal">
              我已阅读并同意
              <Button variant="link" class="text-blue-600 hover:text-blue-700 p-0 h-auto text-sm">《用户协议》</Button>
              和
              <Button variant="link" class="text-blue-600 hover:text-blue-700 p-0 h-auto text-sm">《隐私政策》</Button>
            </Label>
          </div>

          <Button type="submit" class="w-full h-12 text-base font-medium" :disabled="loading">
            {{ loading ? '注册中...' : '注 册' }}
          </Button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-slate-500">
            已有账号？
            <Button variant="link" class="text-blue-600 hover:text-blue-700 p-0 h-auto text-sm" @click="goToLogin">
              立即登录
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
