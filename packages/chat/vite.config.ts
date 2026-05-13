import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  if (mode !== 'lib') {
    return {
      plugins: [vue()],
      server: {
        host: '0.0.0.0',
      },
    }
  }

  return {
    plugins: [vue()],
    server: {
      host: '0.0.0.0',
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'TinyRobotChat',
        formats: ['es', 'cjs'],
        fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
      },
      rollupOptions: {
        external: ['vue'],
        output: {
          globals: {
            vue: 'Vue',
          },
        },
      },
    },
  }
})
