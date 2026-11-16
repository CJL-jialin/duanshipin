import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'script',
        name: 'Script',
        component: () => import('../views/Script.vue')
      },
      {
        path: 'review',
        name: 'Review',
        component: () => import('../views/Review.vue')
      },
      {
        path: 'avatar',
        name: 'Avatar',
        component: () => import('../views/Avatar.vue')
      },
      {
        path: 'video',
        name: 'Video',
        component: () => import('../views/Video.vue')
      },
      {
        path: 'publish',
        name: 'Publish',
        component: () => import('../views/Publish.vue')
      },
      {
        path: 'asr',
        name: 'Asr',
        component: () => import('../views/Asr.vue')
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('../views/Analytics.vue')
      }
    ]
  }
]

const router = createRouter({
  history: import.meta.env.VITE_DEMO_MODE === 'true'
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
