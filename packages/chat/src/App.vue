<template>
  <Chat.Root :layout="layout">
    <Chat.Main>
      <p>这里是聊天内容</p>
      <button @click="toggleLayout">切换布局</button>
      <Chat.SidebarSwitch></Chat.SidebarSwitch>
    </Chat.Main>

    <Chat.Sidebar position="left">
      <template #default="{ sidebarLeft, sidebarOpen }">
        <div style="padding: 0 8px; margin: 8px 0; display: flex; align-items: center; gap: 8px">
          <Chat.SidebarSwitch>
            <IconPanelLeft :size="20" style="color: #0d0d0d; stroke-width: 1.5" />
          </Chat.SidebarSwitch>
          <p class="sidebar-title" :class="{ hidden: sidebarLeft && !sidebarOpen }">Tiny Robot Chat</p>
        </div>
        <div class="new-session-container" style="padding: 0 8px; margin: 8px 0; display: flex; align-items: center">
          <button class="icon-button" :class="{ hidden: sidebarLeft && sidebarOpen }">
            <IconMessageCirclePlus :size="20" style="color: #0d0d0d; stroke-width: 1.5" />
          </button>
          <button class="new-session" :class="{ hidden: sidebarLeft && !sidebarOpen }">
            <IconMessageCirclePlus :size="20" style="stroke-width: 1.5" />
            <span>新会话</span>
          </button>
        </div>
      </template>
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
import { ref } from 'vue'
import { Chat } from './index'
import { IconPanelLeft } from './icons'
import IconMessageCirclePlus from './icons/IconMessageCirclePlus.vue'

const layout = ref<'left-right' | 'top-bottom'>('left-right')
function toggleLayout() {
  layout.value = layout.value === 'left-right' ? 'top-bottom' : 'left-right'
}
</script>

<style scoped>
.sidebar-title {
  margin: 0;
  font-weight: bold;
  transition: opacity 0.2s ease;
}
.hidden {
  opacity: 0;
  user-select: none;
}
.icon-button {
  display: inline-flex;
  border: none;
  background-color: transparent;
  padding: 6px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
  &:active {
    background-color: rgba(0, 0, 0, 0.2);
  }
}
.new-session-container {
  position: relative;
}
.new-session-container button {
  transition: opacity 0.2s ease;
}
.new-session {
  position: absolute;
  left: calc((100% - 150px) / 2);
  right: 0;
  display: inline-flex;
  width: 150px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: transparent;
  cursor: pointer;
  border: 1px solid #1476ff;
  border-radius: 9999px;
  transition: background-color 0.2s ease;
  padding: 8px 12px;
  &:hover {
    background-color: #deecff;
  }

  svg {
    color: #1476ff;
  }
}
</style>
