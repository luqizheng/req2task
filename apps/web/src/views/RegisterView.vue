<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Message, MagicStick } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const registerFormRef = ref<FormInstance>()
const loading = ref(false)
const registerForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agree: false
})

const validatePassword = (_rule: any, value: any, callback: any) => {
  if (value !== registerForm.value.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate((valid) => {
    if (valid) {
      if (!registerForm.value.agree) {
        ElMessage.warning('请先同意用户协议')
        return
      }
      loading.value = true
      setTimeout(() => {
        loading.value = false
        ElMessage.success('注册成功，请登录')
        router.push('/login')
      }, 1000)
    }
  })
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-bg">
      <div class="register-decoration">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div>
    </div>
    
    <div class="register-card">
      <div class="register-header">
        <div class="logo">
          <el-icon :size="40" class="logo-icon"><MagicStick /></el-icon>
          <span class="logo-text">req2task</span>
        </div>
        <p class="subtitle">创建账号</p>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="rules"
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="邮箱"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="密码（至少6位）"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="确认密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="registerForm.agree">
            我已阅读并同意
            <el-link type="primary">《用户协议》</el-link>
            和
            <el-link type="primary">《隐私政策》</el-link>
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="register-btn"
            native-type="submit"
          >
            {{ loading ? '注册中...' : '注 册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-footer">
        <span class="login-tip">
          已有账号？
          <el-link type="primary" @click="goToLogin">立即登录</el-link>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%);
  position: relative;
  overflow: hidden;
}

.register-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.register-decoration .circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(99, 102, 241, 0.05));
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: -50px;
}

.circle-3 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 20%;
}

.register-card {
  width: 420px;
  padding: 48px 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.logo-icon {
  color: #2563eb;
}

.logo-text {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.5px;
}

.subtitle {
  margin-top: 8px;
  color: #64748b;
  font-size: 14px;
}

.register-form {
  margin-top: 24px;
}

.register-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

.register-footer {
  margin-top: 24px;
  text-align: center;
}

.login-tip {
  color: #64748b;
  font-size: 14px;
}
</style>