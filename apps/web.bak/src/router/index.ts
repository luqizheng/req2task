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
      component: () => import('@/views/HomeView.vue'),
      meta: { public: true }
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
      component: () => import('@/views/ProjectDetailView/ProjectDetailView.vue')
    },
    {
      path: '/projects/:id/raw-requirements',
      name: 'rawRequirementList',
      component: () => import('@/views/RawRequirementList/RawRequirementList.vue')
    },
    {
        path: '/projects/:id/raw-requirements/create',
        name: 'rawRequirementCreate',
       component: () => import('../views/RawRequirementEditor/RawRequirementEditor.vue')
    },
    {
        path: '/projects/:id/raw-requirements/:rawRequirementId/edit',
        name: 'rawRequirementEdit',
        component: () => import('@/views/RawRequirementEditor/RawRequirementEditor.vue')
    },
    {
        path: '/projects/:id/raw-requirements/:rawRequirementId',
        name: 'rawRequirementDetail',
        component: () => import('@/views/RawRequirementDetail/RawRequirementDetail.vue')
    },
    {
      path: '/projects/:id/modules',
      name: 'projectModules',
      component: () => import('@/views/ProjectModulesView.vue')
    },
    {
      path: '/projects/:id/progress',
      name: 'projectProgress',
      component: () => import('@/views/ProjectProgressView.vue')
    },
    {
      path: '/projects/:id/baselines',
      name: 'baselineManage',
      component: () => import('@/views/BaselineManageView.vue')
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
      path: '/requirements/:requirementId/tasks',
      name: 'taskBoard',
      component: () => import('@/views/TaskBoardView.vue')
    },
    {
      path: '/tasks/:id',
      name: 'taskDetail',
      component: () => import('@/views/TaskDetailView.vue')
    },
    {
      path: '/test-status-timeline',
      name: 'testStatusTimeline',
      component: () => import('@/views/TestStatusTimeline.vue'),
      meta: { public: true }
    },
    {
      path: '/ai/config',
      name: 'aiConfig',
      component: () => import('@/views/AiConfig/AiConfigView.vue')
    },
    {
      path: '/ai/config/test/:id?',
      name: 'aiConfigTest',
      component: () => import('@/views/AiConfig/AiConfigTestView.vue')
    },
   
    {
      path: '/ai/requirement-gen',
      name: 'aiRequirementGen',
      component: () => import('@/views/AiRequirementGenView.vue')
    },
    {
      path: '/requirements/:id/chat',
      name: 'requirementChat',
      component: () => import('@/views/RequirementChatView.vue')
    },
    {
      path: '/requirements/:requirementId/user-stories',
      name: 'userStoryManage',
      component: () => import('@/views/UserStoryManageView.vue')
    },
    {
      path: '/raw-requirements/analyze',
      name: 'rawRequirementAnalyze',
      component: () => import('@/views/RawRequirementAnalyzer/RawRequirementAnalyzer.vue')
    },
  ]
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const isPublic = to.meta.public === true
  
  if (!isPublic && !userStore.isLoggedIn()) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && userStore.isLoggedIn()) {
    next('/dashboard')
  } else if (to.path === '/' && userStore.isLoggedIn()) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
