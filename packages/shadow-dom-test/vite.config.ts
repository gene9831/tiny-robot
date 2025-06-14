import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('app-shadow'),
        },
      },
    }),
  ],
  resolve: {
    alias: {
      // '@opentiny/tiny-robot': path.resolve(__dirname, '../../packages/components/src'),
    },
  },
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'style.css'
          }
          return '[name][extname]'
        },
      },
    },
  },
})
