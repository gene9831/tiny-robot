import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuejsx from '@vitejs/plugin-vue-jsx'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vuejsx()],
  resolve: {
    alias: [
      {
        find: /^@opentiny\/tiny-robot$/,
        replacement: fileURLToPath(new URL('../components/src/index.ts', import.meta.url)),
      },
    ],
  },
})
