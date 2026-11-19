<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import ChatScene from './scenes/ChatScene.vue'
import LiveChatScene from './scenes/LiveChatScene.vue'
import ExtensionsScene from './scenes/ExtensionsScene.vue'
import ApprovalScene from './scenes/ApprovalScene.vue'
import ComposerScene from './scenes/ComposerScene.vue'
import ModelScene from './scenes/ModelScene.vue'
import InputPrefixScene from './scenes/InputPrefixScene.vue'

const scenes = [
  { id: 'chat', title: '聊天主界面', hint: '切换会话 → 输入问题 → 查看流式回复', component: ChatScene },
  { id: 'live-chat', title: '真实模型与附件', hint: '切换会话 → 添加图片 → 查看百炼回复', component: LiveChatScene },
  {
    id: 'anchor',
    title: '长对话导航',
    hint: '跳到历史提问 → 滚动 → 回到最新消息',
    mode: 'anchor' as const,
    component: ChatScene,
  },
  { id: 'floating', title: '浮动聊天', hint: '拖动顶部 → 拉伸边缘', mode: 'floating' as const, component: ChatScene },
  {
    id: 'toolbar',
    title: '输入工具栏',
    hint: '切换工具栏顺序 → 打开模型面板',
    mode: 'toolbar' as const,
    component: ChatScene,
  },
  { id: 'model', title: '模型选择', hint: '浏览分组 → 搜索 → 选择思考强度', component: ModelScene },
  {
    id: 'extensions',
    title: 'MCP 与 Skill',
    hint: '搜索与安装 → 导入 samples/weekly-report 文件夹 → 查看详情',
    component: ExtensionsScene,
  },
  {
    id: 'approval',
    title: '工具确认',
    hint: '先允许调用 → 重置并再次请求 → 刷新 → 拒绝调用',
    component: ApprovalScene,
  },
  {
    id: 'composer',
    title: '模型与输入',
    hint: '搜索模型 → 选择思考强度 → 输入或插入模板 → 发送',
    component: ComposerScene,
  },
  {
    id: 'input-prefix',
    title: '多行首行提示',
    hint: '起草客户回复 → 切换交接摘要 → 对照两次提交',
    component: InputPrefixScene,
  },
]
const route = ref(window.location.hash.slice(1) || 'chat')
const current = computed(() => scenes.find((scene) => scene.id === route.value) ?? scenes[0])
const clean = ref(new URLSearchParams(window.location.search).get('clean') === '1')
const revision = ref(0)
const scene = ref<InstanceType<typeof ApprovalScene> | null>(null)
async function resetCurrentScene() {
  if (current.value.id === 'approval') await scene.value?.reset()
  revision.value++
}
const syncRoute = () => {
  route.value = window.location.hash.slice(1)
}
const handleShortcut = (event: KeyboardEvent) => {
  if (event.altKey && event.code === 'KeyR') {
    event.preventDefault()
    clean.value = !clean.value
  }
}
onMounted(() => {
  window.addEventListener('hashchange', syncRoute)
  window.addEventListener('keydown', handleShortcut)
})
onUnmounted(() => {
  window.removeEventListener('hashchange', syncRoute)
  window.removeEventListener('keydown', handleShortcut)
})
</script>

<template>
  <div class="recording-shell" :class="{ 'is-clean': clean }">
    <header v-if="!clean" class="recording-controls">
      <div class="control-heading">
        <div><strong>TinyRobot 1.0 · 录制工作台</strong><span>本地录制工作台</span></div>
        <div class="control-actions">
          <button class="utility-button" @click="resetCurrentScene">重置当前场景</button>
          <button class="utility-button" @click="clean = true">隐藏录制控制栏</button>
        </div>
      </div>
      <nav aria-label="录制场景">
        <a
          v-for="scene in scenes"
          :key="scene.id"
          :href="`#${scene.id}`"
          :aria-current="current.id === scene.id ? 'page' : undefined"
          >{{ scene.title }}</a
        >
      </nav>
      <p>{{ current.hint }}<span>Alt + R 隐藏 / 显示控制栏 · 建议画面 1440 × 1000</span></p>
    </header>
    <main class="capture-stage" :aria-label="current.title">
      <component :is="current.component" :key="`${current.id}-${revision}`" :mode="current.mode" ref="scene" />
    </main>
  </div>
</template>
