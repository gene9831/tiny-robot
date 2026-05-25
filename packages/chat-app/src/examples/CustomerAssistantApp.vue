<script setup lang="ts">
import { useMessage } from '@opentiny/tiny-robot-kit'
import ChatMessages from '../components/ChatMessages.vue'
import ChatSender from '../components/ChatSender.vue'
import { initialMessages, mockResponseProvider } from '../mock/chat'

const { messages, isProcessing, sendMessage, abortRequest } = useMessage({
  initialMessages,
  responseProvider: mockResponseProvider,
  plugins: [
    {
      name: 'mock-error-state',
      onError({ currentTurn }) {
        const lastMessage = currentTurn.at(-1)

        if (lastMessage) {
          lastMessage.content = '响应失败，请点击重试图标重试。'
          lastMessage.state = {
            ...lastMessage.state,
            error: true,
          }
        }
      },
    },
  ],
})

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
      <h3>TinyRobot AI 智能客服</h3>
    </header>
    <aside class="app-aside">Aside</aside>
    <main class="app-main">
      <ChatMessages :messages="messages" :isProcessing="isProcessing" @regenerate="resendUserMessage" />
    </main>
    <footer class="app-footer">
      <ChatSender :processing="isProcessing" @send="sendMessage" @stop="abortRequest" />
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
