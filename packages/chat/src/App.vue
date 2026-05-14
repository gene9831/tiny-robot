<template>
  <Chat.Root>
    <Chat.Layout
      :layout="layout"
      :sidebar-left-width="sidebarLeftWidth"
      :sidebar-left-close-width="sidebarLeftCloseWidth"
    >
      <Chat.Main>
        <p>这里是聊天内容</p>
        <div>
          <button @click="toggleLayout">切换布局</button>
        </div>
        <div>
          <Chat.SidebarSwitch></Chat.SidebarSwitch>
        </div>
        <div>
          <button @click="toggleSidebarCollapseMode">切换侧边栏折叠模式（当前：{{ sidebarCollapseMode }}）</button>
        </div>
        <div>
          <label
            >展开宽度: {{ sidebarLeftWidth }}px
            <input type="range" min="100" max="500" v-model.number="sidebarLeftWidth"
          /></label>
        </div>
        <div>
          <label
            >折叠宽度: {{ sidebarLeftCloseWidth }}px
            <input type="range" min="0" max="100" v-model.number="sidebarLeftCloseWidth"
          /></label>
        </div>
      </Chat.Main>

      <Chat.Sidebar position="left" :collapse-mode="sidebarCollapseMode">
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
    </Chat.Layout>
  </Chat.Root>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Chat } from './index'
import { IconPanelLeft, IconMessageCirclePlus } from './icons'

const layout = ref<'left-right' | 'top-bottom'>('left-right')
function toggleLayout() {
  layout.value = layout.value === 'left-right' ? 'top-bottom' : 'left-right'
}

const sidebarCollapseMode = ref<'overlay' | 'slide'>('overlay')
function toggleSidebarCollapseMode() {
  sidebarCollapseMode.value = sidebarCollapseMode.value === 'overlay' ? 'slide' : 'overlay'
}

const sidebarLeftWidth = ref(300)
const sidebarLeftCloseWidth = ref(48)
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
  left: 40px;
  right: 40px;
  display: inline-flex;
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
