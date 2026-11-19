import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { recordingModel } from './server/mock-model'
import { bailianRecording } from './server/bailian'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.env.RELEASE_SHOWCASE_ENV_DIR ?? process.cwd(), 'DASHSCOPE_')
  return {
    plugins: [
      vue(),
      recordingModel(),
      bailianRecording(env.DASHSCOPE_API_KEY?.trim() ?? '', env.DASHSCOPE_BASE_URL ?? ''),
    ],
    server: {
      host: '127.0.0.1',
      port: 4175,
      strictPort: true,
      watch: { ignored: ['**/.recording/**'] },
    },
  }
})
