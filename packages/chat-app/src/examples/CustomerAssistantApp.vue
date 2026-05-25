<script setup lang="ts">
import { ref } from 'vue'
import ChatMessages from '../components/ChatMessages.vue'

const messages = ref([
  {
    role: 'assistant',
    content: '您好，我是 AI 智能客服，请问有什么可以帮助您？',
  },
  {
    role: 'user',
    content: '我的订单已经付款了，为什么还没有发货？',
  },
  {
    role: 'assistant',
    content: '您好，订单付款后未发货通常可能是商家备货、仓库排队或物流尚未揽收。建议您先查看订单页的预计发货时间。',
  },
])
</script>

<template>
  <div class="chat-app">
    <header class="app-header">
      <h1>Header</h1>
    </header>
    <aside class="app-aside">Aside</aside>
    <main class="app-main">
      <ChatMessages :messages="messages" />
    </main>
    <footer class="app-footer">
      <h2>Footer</h2>
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
}

.app-aside {
  grid-area: aside;
}

.app-main {
  grid-area: main;
  overflow: auto;
}

.app-footer {
  grid-area: footer;
}
</style>
