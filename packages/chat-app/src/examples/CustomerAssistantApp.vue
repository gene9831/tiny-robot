<script setup lang="ts">
import { computed } from 'vue'
import ChatHistory from '../components/ChatHistory.vue'
import ChatMessages from '../components/ChatMessages.vue'
import ChatSender from '../components/ChatSender.vue'
import { useChatConversation } from '../composables/useChatConversation'
import { initialMessages } from '../mock/chat'

const { activeConversation, createConversation, sendMessage, abortActiveRequest, updateConversationTitle } =
  useChatConversation()

const activeEngine = computed(() => activeConversation.value?.engine)
const activeTitle = computed(() => activeConversation.value?.title || 'TinyRobot AI 智能客服')
const messages = computed(() => activeEngine.value?.messages.value ?? [])
const isProcessing = computed(() => activeEngine.value?.isProcessing.value ?? false)

const handleSendMessage = (content: string) => {
  const message = content.trim()

  if (!message) {
    return
  }

  if (!activeConversation.value) {
    const conversation = createConversation({
      title: message.slice(0, 24),
      useMessageOptions: {
        initialMessages,
      },
    })

    conversation.engine.sendMessage(message)
    return
  }

  const hasUserMessage = activeEngine.value?.messages.value.some((item) => item.role === 'user')

  if (!hasUserMessage) {
    updateConversationTitle(activeConversation.value.id, message.slice(0, 24))
  }

  sendMessage(message)
}

const resendUserMessage = (userMessageIndex: number) => {
  const content = messages.value[userMessageIndex]?.content

  if (typeof content === 'string') {
    messages.value.splice(userMessageIndex)
    sendMessage(content)
  }
}
</script>

<template>
  <div class="chat-app">
    <header class="app-header">
      <h3>{{ activeTitle }}</h3>
    </header>
    <aside class="app-aside">
      <ChatHistory />
    </aside>
    <main class="app-main">
      <ChatMessages :messages="messages" :isProcessing="isProcessing" @regenerate="resendUserMessage" />
    </main>
    <footer class="app-footer">
      <ChatSender :processing="isProcessing" @send="handleSendMessage" @stop="abortActiveRequest" />
    </footer>
  </div>
</template>

<style scoped>
.chat-app {
  --aside-width: 300px;

  height: 100vh;

  display: grid;
  grid-template-areas:
    'aside header'
    'aside main'
    'aside footer';
  grid-template-rows: auto 1fr auto;
  grid-template-columns: var(--aside-width) 1fr;
}

.app-header,
.app-aside,
.app-main,
.app-footer {
  border: 1px solid #d9e2ec;
}

.app-header {
  grid-area: header;
  padding: 0 12px;
}

.app-aside {
  grid-area: aside;
}

.app-main {
  grid-area: main;
  overflow: hidden;
}

.app-footer {
  grid-area: footer;
  padding: 16px;
}
</style>
