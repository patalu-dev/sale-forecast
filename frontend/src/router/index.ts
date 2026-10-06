import { createRouter, createWebHistory } from 'vue-router'
import { user } from '@/composables/authState'
import { useAuth } from '@/composables/useAuth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('@/pages/LoginForm.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/users',
      name: 'users.index',
      component: () => import('@/pages/users/Index.vue'),
      meta: { requiresAuth: true, action: 'view', subject: 'User' },
    },
    {
      path: '/roles',
      name: 'roles.index',
      component: () => import('@/pages/roles/Index.vue'),
      meta: { requiresAuth: true, action: 'view', subject: 'Role' },
    },
    {
      path: '/permissions',
      name: 'permissions.index',
      component: () => import('@/pages/permissions/Index.vue'),
      meta: { requiresAuth: true, action: 'view', subject: 'Permission' },
    },
    {
      path: '/forecast',
      name: 'forecast.index',
      component: () => import('@/pages/forecast/Index.vue'),
      meta: { requiresAuth: true, title: 'Dự báo bán hàng', action: 'view', subject: 'Forecast' },
    },
    {
      path: '/targets',
      name: 'targets.index',
      component: () => import('@/pages/targets/Index.vue'),
      meta: { requiresAuth: true, title: 'Chỉ tiêu tháng', action: 'view', subject: 'Target' },
    },
    {
      path: '/summary',
      name: 'summary.index',
      component: () => import('@/pages/summary/Index.vue'),
      meta: { requiresAuth: true, title: 'Summary', action: 'view', subject: 'Summary' },
    },
    {
      path: '/reports',
      name: 'reports.index',
      component: () => import('@/pages/reports/Index.vue'),
      meta: { requiresAuth: true, title: 'Reports', action: 'view', subject: 'Report' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/pages/forecast/Index.vue'),
      meta: { requiresAuth: true, title: 'Dự báo bán hàng', action: 'view', subject: 'Forecast' },
    },
    {
      path: '/change-password',
      name: 'change-password',
      component: () => import('@/pages/ChangePassword.vue'),
      meta: { requiresAuth: true, title: 'Thay đổi mật khẩu' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFound.vue'),
      meta: { requiresAuth: false },
    },
  ],
})

router.beforeEach((to, _from) => {
  if (to.meta.requiresAuth && !user.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && user.value) {
    return { name: 'dashboard' }
  }

  // Chặn truy cập trang không có quyền (theo action/subject trong meta)
  if (to.meta.requiresAuth && user.value && to.meta.action && to.meta.subject) {
    const { can } = useAuth()
    if (!can(to.meta.action as string, to.meta.subject as string)) {
      return { name: 'not-found' }
    }
  }
})

export default router
