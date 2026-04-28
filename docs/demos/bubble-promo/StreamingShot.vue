<template>
  <section class="stream-shot">
    <aside class="side-panel">
      <p class="eyebrow">Streaming Response</p>
      <h2>响应式内容，天然适配流式输出</h2>
      <p class="summary">
        业务只需要持续更新 content，Bubble 会跟随 Vue 响应式系统自然刷新，适合 SSE、Fetch Stream 和模型逐片段返回。
      </p>
      <div class="meter">
        <span :style="{ width: `${progress}%` }"></span>
      </div>
      <p class="progress">{{ progress }}% generated</p>
    </aside>

    <main class="chat-panel">
      <tr-bubble
        class="user-bubble"
        role="user"
        content="请用三句话介绍 TinyRobot Bubble 的特点。"
        placement="end"
        :avatar="userAvatar"
      />
      <tr-bubble
        role="assistant"
        :content="streamContent"
        :avatar="aiAvatar"
        :state="{ thinking: isTyping, open: true }"
      />
      <div class="typing-indicator" v-if="progress < 100">
        <span></span>
        <span></span>
        <span></span>
        <b>AI 正在生成</b>
      </div>
    </main>
  </section>
</template>

<script setup lang="ts">
import { TrBubble } from '@opentiny/tiny-robot'
import { IconAi, IconUser } from '@opentiny/tiny-robot-svgs'
import { computed, h, onMounted, onUnmounted, ref } from 'vue'

const aiAvatar = h(IconAi, { style: { fontSize: '32px' } })
const userAvatar = h(IconUser, { style: { fontSize: '32px' } })

const fullText =
  'TinyRobot Bubble 提供面向 AI 对话的消息展示能力，支持流式文本、图片、Markdown、推理过程和工具调用。它通过 BubbleList 管理完整对话流，通过 BubbleProvider 扩展自定义渲染器。开发者可以把精力放在业务逻辑和模型能力上，而不是反复处理消息 UI 细节。'

const streamContent = ref('')
const isTyping = ref(false)
const progress = computed(() => Math.round((streamContent.value.length / fullText.length) * 100))
let cancelled = false

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function play() {
  while (!cancelled) {
    streamContent.value = ''
    isTyping.value = true

    for (const char of fullText) {
      if (cancelled) {
        return
      }
      streamContent.value += char
      await sleep(34)
    }

    isTyping.value = false
    await sleep(1800)
  }
}

onMounted(play)

onUnmounted(() => {
  cancelled = true
})
</script>

<style scoped>
.stream-shot {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 330px 1fr;
  gap: 24px;
  width: 960px;
  height: 560px;
  padding: 28px;
  background: #f7f9fc;
  color: #172033;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

.side-panel {
  padding: 26px;
  border: 1px solid #dce6f4;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(32, 64, 110, 0.1);
}

.eyebrow {
  margin: 0 0 12px;
  color: #0f766e;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.18;
}

.summary {
  margin: 18px 0 28px;
  color: #53627a;
  font-size: 15px;
  line-height: 1.7;
}

.meter {
  overflow: hidden;
  height: 8px;
  border-radius: 999px;
  background: #e3ebf6;
}

.meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #14b8a6;
  transition: width 0.1s linear;
}

.progress {
  margin: 10px 0 0;
  color: #0f766e;
  font-size: 13px;
  font-weight: 700;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 30px;
  border: 1px solid #dce6f4;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(32, 64, 110, 0.1);
}

.chat-panel :deep([data-role='user']) {
  --tr-bubble-box-bg: #e6f0ff;
}

.chat-panel :deep([data-role='assistant']) {
  --tr-bubble-max-width: 520px;
  --tr-bubble-box-bg: #ffffff;
  --tr-bubble-box-border: 1px solid #dde7f4;
  --tr-bubble-text-line-height: 1.72;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  margin-left: 48px;
  color: #64748b;
  font-size: 13px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #14b8a6;
  animation: pulse 1.1s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.14s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.28s;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    opacity: 0.32;
    transform: translateY(0);
  }

  40% {
    opacity: 1;
    transform: translateY(-3px);
  }
}
</style>
