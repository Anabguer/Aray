import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const APP_BASE = '/aray/afkacademy/'

/** Redirige /aray/afkacademy → /aray/afkacademy/ (Vite exige la barra final). */
function redirectBaseSlash(): Plugin {
  const bare = APP_BASE.replace(/\/$/, '')
  const redirect = (
    req: { url?: string },
    res: { statusCode: number; setHeader: (k: string, v: string) => void; end: () => void },
    next: () => void,
  ) => {
    const url = req.url?.split('?')[0] ?? ''
    if (url === bare) {
      res.statusCode = 302
      res.setHeader('Location', APP_BASE)
      res.end()
      return
    }
    next()
  }
  return {
    name: 'afk-redirect-base-slash',
    configureServer(server) {
      server.middlewares.use(redirect)
    },
    configurePreviewServer(server) {
      server.middlewares.use(redirect)
    },
  }
}

/** Hostalia: /aray/afkacademy/ */
export default defineConfig({
  plugins: [react(), redirectBaseSlash()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@feinetas': path.resolve(__dirname, './feinetas'),
    },
  },
  base: APP_BASE,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      // /aray/afkacademy/api/v1 → PHP en la raíz del proyecto (/api/v1)
      '/aray/afkacademy/api': {
        target: 'http://127.0.0.1:8777',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/aray\/afkacademy/, ''),
      },
      // Scripts smoke legacy y health directo
      '/api': {
        target: 'http://127.0.0.1:8777',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    pool: 'threads',
    fileParallelism: false,
    testTimeout: 15000,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
