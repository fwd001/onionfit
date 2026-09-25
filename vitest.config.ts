import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// 只跑 core/ 纯 TS 单测：不加载 vite.config.ts 的 vue/UnoCSS/PWA 插件，
// 域层无 Vue 依赖（.trae 计划 §2），node 环境即可，秒级启动
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
})
