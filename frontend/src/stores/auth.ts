import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth'
import type { User } from '../types'
import { useProductionStore } from './production'

/** 记住我 = localStorage 持久保存；不记住 = 只放 sessionStorage，关掉标签页即失效 */
const TOKEN_KEY = import.meta.env.VITE_DEMO_MODE === 'true' ? 'video_studio_demo_token' : 'video_studio_cpu_token'
const readToken = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || (import.meta.env.VITE_DEMO_MODE === 'true' ? 'demo-visitor' : null)

const writeToken = (value: string, remember: boolean) => {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, value)
    sessionStorage.removeItem(TOKEN_KEY)
  } else {
    sessionStorage.setItem(TOKEN_KEY, value)
    localStorage.removeItem(TOKEN_KEY)
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(readToken())
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(username: string, password: string, remember = true) {
    const response = await authApi.login(username, password)
    const accessToken = response.data.access_token
    token.value = accessToken
    writeToken(accessToken, remember)
    useProductionStore().switchAccount()
    await fetchUser()
  }

  async function register(username: string, email: string, password: string) {
    await authApi.register(username, email, password)
  }

  async function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    useProductionStore().switchAccount()
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      const response = await authApi.getCurrentUser()
      user.value = response.data
    } catch (error) {
      // Token失效，清除登录状态
      await logout()
    }
  }

  async function checkAuth() {
    if (token.value) {
      await fetchUser()
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUser,
    checkAuth
  }
})
