import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { demoAdapter } from '../demo/adapter'

// 缺省走同源 /api，由 Vite 代理转发到后端（见 vite.config.js）。
// 这里的兜底值必须与实际使用的地址一致，否则一旦 .env 缺失就会静默指向错误端口。
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const request: AxiosInstance = axios.create({
  ...(import.meta.env.VITE_DEMO_MODE === 'true' ? { adapter: demoAdapter } : {}),
  baseURL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const tokenKey = import.meta.env.VITE_DEMO_MODE === 'true' ? 'video_studio_demo_token' : 'video_studio_cpu_token'
    const token = localStorage.getItem(tokenKey) || sessionStorage.getItem(tokenKey)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    // 如果返回的状态码不是200，则认为是错误
    if (res.code && res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return res
  },
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error)
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 登录页上的 401 就是「用户名或密码错误」，此时不能跳转（会整页刷新丢输入），
          // 也不能弹「未授权，请重新登录」——交给登录页自己的内联提示条去说。
          if (window.location.pathname === '/login') break
          ElMessage.error('未授权，请重新登录')
          localStorage.removeItem('video_studio_cpu_token')
          sessionStorage.removeItem('video_studio_cpu_token')
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('拒绝访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default: {
          // FastAPI 的错误体是 {detail: "..."}（HTTPException）或 {detail:[...]}（422 校验），
          // 与后端的 {message} 结构不同，两者都要兼容，否则后端写好的中文指引会被吞掉。
          const data = error.response.data
          let msg = '请求失败'
          if (data && typeof data === 'object') {
            const detail = (data as any).detail
            if (typeof detail === 'string' && detail) {
              msg = detail
            } else if (Array.isArray(detail) && detail.length) {
              msg = detail[0]?.msg || msg
            } else if (typeof (data as any).message === 'string' && (data as any).message) {
              msg = (data as any).message
            }
          } else if (typeof data === 'string' && data) {
            msg = data
          }
          ElMessage.error(msg)
        }
      }
    } else if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')) {
      // axios 主动超时（请求还在路上被掐掉）：与真网络断分开说，
      // 否则「网络错误」会把人引去查后端——后端其实多半还在正常跑
      ElMessage.error('请求耗时过长已中断，稍后重试或刷新查看结果')
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export default request
