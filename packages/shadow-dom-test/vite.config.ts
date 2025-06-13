import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'
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
    {
      name: 'copy-style-after-build',
      apply: 'build',
      closeBundle() {
        const from = path.resolve(__dirname, 'dist/style.css')
        const to = path.resolve(__dirname, 'dist-style.css')

        if (fs.existsSync(to)) {
          const fromContent = fs.readFileSync(from, 'utf-8')
          const toContent = fs.readFileSync(to, 'utf-8')

          if (fromContent === toContent) {
            console.log('⏭️ Files are identical, skipping copy')
            return
          }
        }

        if (fs.existsSync(from)) {
          fs.copyFileSync(from, to)
          console.log(`✅ Copied style.css to ${to}`)
        } else {
          console.warn('⚠️ style.css not found, skip copying')
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@opentiny/tiny-robot': path.resolve(__dirname, '../../packages/components/src'),
      '@opentiny/tiny-robot-styles': path.resolve(__dirname, '../../packages/components/dist/style.css'),
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
