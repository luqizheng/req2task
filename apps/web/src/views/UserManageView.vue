<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Search, Plus, Edit, Delete, Refresh } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'

interface UserItem {
  id: number
  username: string
  name: string
  email: string
  phone: string
  role: string
  status: number
  createTime: string
}

const loading = ref(false)
const searchKeyword = ref('')
const roleFilter = ref('')
const statusFilter = ref<number | null>(null)

const userList = ref<UserItem[]>([
  { id: 1, username: 'admin', name: '张经理', email: 'zhang@company.com', phone: '13800138000', role: '项目经理', status: 1, createTime: '2024-01-15' },
  { id: 2, username: 'analyst', name: '李分析师', email: 'li@company.com', phone: '13800138001', role: '需求分析师', status: 1, createTime: '2024-01-16' },
  { id: 3, username: 'dev001', name: '王开发', email: 'wang@company.com', phone: '13800138002', role: '开发人员', status: 1, createTime: '2024-01-17' },
  { id: 4, username: 'test001', name: '赵测试', email: 'zhao@company.com', phone: '13800138003', role: '测试人员', status: 0, createTime: '2024-01-18' },
])

const total = ref(4)

const dialogVisible = ref(false)
const dialogTitle = ref('添加用户')
const formRef = ref<FormInstance>()
const formData = reactive({
  id: null as number | null,
  username: '',
  name: '',
  email: '',
  phone: '',
  role: '',
  password: ''
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }]
}

const roleOptions = [
  { value: '项目经理', label: '项目经理' },
  { value: '需求分析师', label: '需求分析师' },
  { value: '开发人员', label: '开发人员' },
  { value: '测试人员', label: '测试人员' },
]

const handleSearch = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
}

const handleReset = () => {
  searchKeyword.value = ''
  roleFilter.value = ''
  statusFilter.value = null
}

const handleAdd = () => {
  dialogTitle.value = '添加用户'
  Object.assign(formData, { id: null, username: '', name: '', email: '', phone: '', role: '', password: '' })
  dialogVisible.value = true
}

const handleEdit = (row: UserItem) => {
  dialogTitle.value = '编辑用户'
  Object.assign(formData, row)
  formData.password = ''
  dialogVisible.value = true
}

const handleDelete = async (row: UserItem) => {
  try {
    await ElMessageBox.confirm(`确定删除用户 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const idx = userList.value.findIndex(u => u.id === row.id)
    if (idx > -1) userList.value.splice(idx, 1)
    ElMessage.success('删除成功')
  } catch {
    // cancelled
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      if (formData.id) {
        const idx = userList.value.findIndex(u => u.id === formData.id)
        if (idx > -1) Object.assign(userList.value[idx], formData, { password: undefined })
        ElMessage.success('更新成功')
      } else {
        userList.value.unshift({ ...formData, id: Date.now(), status: 1, createTime: new Date().toISOString().split('T')[0] })
        ElMessage.success('添加成功')
      }
      dialogVisible.value = false
    }
  })
}

const getRoleTagType = (role: string) => {
  const map: Record<string, string> = {
    '项目经理': 'primary',
    '需求分析师': 'success',
    '开发人员': 'warning',
    '测试人员': 'info'
  }
  return map[role] || ''
}
</script>

<template>
  <div class="user-manage">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="关键词">
          <el-input v-model="searchKeyword" placeholder="用户名/姓名/邮箱" clearable :prefix-icon="Search" style="width: 200px" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="roleFilter" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="r in roleOptions" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="statusFilter" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="handleAdd">添加用户</el-button>
      </div>

      <el-table :data="userList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="email" label="邮箱" min-width="160">
          <template #default="{ row }">
            <el-link type="primary" :underline="false">{{ row.email }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)" size="small">{{ row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="120" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          :total="total"
          :current-page="1"
          :page-size="10"
          layout="total, prev, pager, next"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80" class="user-form">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" :disabled="!!formData.id" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" placeholder="请选择角色" style="width: 100%">
            <el-option v-for="r in roleOptions" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" :prop="formData.id ? '' : 'password'">
          <el-input v-model="formData.password" type="password" show-password :placeholder="formData.id ? '留空则不修改' : '请输入密码'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.user-manage {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-form {
  margin-bottom: 0;
}

.table-card :deep(.el-card__body) {
  padding: 0;
}

.table-toolbar {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.pagination-wrapper {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
}

.user-form {
  padding-right: 16px;
}
</style>
