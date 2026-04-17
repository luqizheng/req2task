import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { public: true }
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue')
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UserManageView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue')
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/ProjectListView.vue')
    },
    {
      path: '/projects/:id',
      name: 'projectDetail',
      component: () => import('@/views/ProjectDetailView.vue')
    },
    {
      path: '/projects/:projectId/modules/:moduleId/requirements',
      name: 'requirementList',
      component: () => import('@/views/RequirementListView.vue')
    },
    {
      path: '/requirements/:id',
      name: 'requirementDetail',
      component: () => import('@/views/RequirementDetailView.vue')
    },
    {
      path: '/ai/config',
      name: 'aiConfig',
      component: () => import('@/views/AiConfigView.vue')
    },
    {
      path: '/ai/chat',
      name: 'aiChat',
      component: () => import('@/views/AiChatView.vue')
    },
    {
      path: '/ai/requirement-gen',
      name: 'aiRequirementGen',
      component: () => import('@/views/AiRequirementGenView.vue')
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const isPublic = to.meta.public === true
  
  if (!isPublic && !userStore.isLoggedIn()) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && userStore.isLoggedIn()) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
