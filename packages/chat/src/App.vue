<template>
  <Chat.Root>
    <Chat.Main>
      <p>这里是聊天内容</p>
    </Chat.Main>

    <Chat.Sidebar position="left">
      <p>历史记录</p>
    </Chat.Sidebar>

    <Chat.Header>
      <h1>AI 聊天应用</h1>
    </Chat.Header>

    <Chat.Footer>
      <input type="text" placeholder="请输入..." />
    </Chat.Footer>

    <Chat.Sidebar position="right">
      <p>扩展功能</p>
    </Chat.Sidebar>
  </Chat.Root>
</template>

<script setup lang="ts">
import { Chat } from './index'
</script>
