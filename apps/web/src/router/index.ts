import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true, layout: 'auth' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { public: true, layout: 'auth' },
  },
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
      },
      {
        path: 'projects',
        name: 'projects',
        component: () => import('@/views/ProjectListView/ProjectListView.vue'),
      },
      {
        path: 'projects/:id',
        name: 'project-detail',
        component: () => import('@/views/ProjectDetailView/ProjectDetailView.vue'),
      },
      {
        path: 'projects/:projectId/requirements',
        name: 'requirements',
        component: () => import('@/views/RequirementListView/RequirementListView.vue'),
      },
      {
        path: 'projects/:projectId/requirements/:id',
        name: 'requirement-detail',
        component: () => import('@/views/RequirementDetailView/RequirementDetailView.vue'),
      },
      {
        path: 'projects/:projectId/raw-requirements/:rawRequirementId',
        name: 'raw-requirement-detail',
        component: () => import('@/views/RawRequirementEditor/RawRequirementEditor.vue'),
      },
      {
        path: 'collect/:projectId',
        name: 'requirement-collect',
        component: () => import('@/views/RequirementCollectView/RequirementCollectView.vue'),
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/SettingsView.vue'),
      },
      {
        path: 'ai/config',
        name: 'aiConfig',
        component: () => import('@/views/AiConfig/AiConfigView.vue'),
      },
      {
        path: 'ai/config/:id/test',
        name: 'aiConfigTest',
        component: () => import('@/views/AiConfig/AiConfigTestView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const isPublic = to.meta.public === true

  if (!isPublic && !userStore.isLoggedIn()) {
    next('/login')
  } else if (
    (to.path === '/login' || to.path === '/register') &&
    userStore.isLoggedIn()
  ) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
