import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/** Redirige /aray → /aray/ (Vite exige la barra final con base). */
function redirectBaseSlash(): Plugin {
  const redirect = (
    req: { url?: string },
    res: { statusCode: number; setHeader: (k: string, v: string) => void; end: () => void },
    next: () => void,
  ) => {
    if (req.url === '/aray') {
      res.statusCode = 302
      res.setHeader('Location', '/aray/')
      res.end()
      return
    }
    next()
  }
  return {
    name: 'aray-redirect-base-slash',
    configureServer(server) {
      server.middlewares.use(redirect)
    },
    configurePreviewServer(server) {
      server.middlewares.use(redirect)
    },
  }
}

/** Hostalia: /aray/ */
export default defineConfig({
  plugins: [react(), redirectBaseSlash()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/aray/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    pool: 'threads',
    fileParallelism: false,
    testTimeout: 15000,
  },
})
