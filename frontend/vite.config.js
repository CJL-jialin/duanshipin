import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, path.resolve(root, '../backend'), '')
  const backendPort = environment.API_PORT || '8888'
  const target = process.env.VITE_PROXY_TARGET || `http://127.0.0.1:${backendPort}`
  return {
    base: mode === 'demo' ? '/duanshipin/' : '/',
    plugins: [vue()],
    resolve: { alias: { '@': path.resolve(root, 'src') } },
    server: {
      port: 6173,
      strictPort: true,
      host: '127.0.0.1',
      proxy: {
        '/api': { target, changeOrigin: true },
        '/static': { target, changeOrigin: true }
      }
    }
  }
})
