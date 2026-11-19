<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { TrChat, useChatRuntime, type ChatUIOptions, type LayoutFloatingState } from '@opentiny/tiny-robot-chat'
import { IconAi, IconThink } from '@opentiny/tiny-robot-svgs'
import { createRecordingStorage } from '../data'

const props = defineProps<{ mode?: 'anchor' | 'floating' | 'toolbar' }>()
const modelFirst = ref(false)
const floatingState = ref<LayoutFloatingState>({
  placement: 'top-left',
  offsetX: 48,
  offsetY: 32,
  width: 650,
  height: 480,
})
const error = ref('')
const runtime = useChatRuntime({
  mcpServers: [],
  modelProviders: [
    {
      type: 'openai',
      label: '演示模型',
      apiUrl: new URL('/__recording/chat/completions', window.location.origin).href,
      models: [
        { id: 'general', label: '通用助手', icon: IconAi, group: '日常协作' },
        {
          id: 'reasoner',
          label: '推理助手',
          icon: IconThink,
          group: '分析推理',
        },
      ],
    },
  ],
  conversation: {
    storage: createRecordingStorage(props.mode === 'anchor'),
    autoSaveThrottle: 0,
    onLoad: (items) => {
      const initial = items.find(({ id }) => id === (props.mode === 'anchor' ? 'launch' : 'release'))
      if (initial) void runtime.actions.switchConversation(initial.id)
    },
  },
})
const ui = computed<ChatUIOptions>(() => ({
  brand: { name: 'TinyRobot' },
  anchor: props.mode === 'anchor' ? {} : false,
  layout: {
    leftAside: props.mode === 'anchor' || props.mode === 'toolbar' ? false : { defaultOpen: true, width: 196 },
    contentMaxWidth: 720,
    surface: props.mode === 'floating' ? { mode: 'floating', floatingOptions: { resizable: true } } : undefined,
  },
  sender:
    props.mode === 'toolbar'
      ? {
          toolbar: (defaults) => (modelFirst.value ? defaults : [...defaults].reverse()),
        }
      : undefined,
  welcome: { title: '一起把想法变成行动', description: '从一个问题开始，整理信息、探索思路、推进工作。' },
  labels: { composerPlaceholder: '输入消息…' },
}))
onUnmounted(() => {
  void Promise.resolve(runtime.actions.abort?.()).catch(() => undefined)
})
</script>

<template>
  <section class="chat-scene" :class="mode && `chat-scene--${mode}`">
    <label v-if="mode === 'toolbar'" class="toolbar-control">
      <input v-model="modelFirst" type="checkbox" /> 模型选择优先
    </label>
    <p v-if="error" class="error-message" role="alert">{{ error }}</p>
    <TrChat
      :runtime="runtime"
      :ui="ui"
      :floating-state="mode === 'floating' ? floatingState : undefined"
      @update:floating-state="floatingState = $event"
      @runtime-action-error="error = String($event.error)"
    />
  </section>
</template>
