<template>
  <button class="sidebar-switch" @click="toggleSidebarLeftOpen">
    <slot> {{ sidebarLeftOpen ? '收起' : '展开' }}左侧面板 </slot>
  </button>
</template>

<script setup lang="ts">
import { useChatSidebarContext } from '../context'

withDefaults(defineProps<{ position?: 'left' | 'right' }>(), {
  position: 'left',
})

const { sidebarLeftOpen, toggleSidebarLeftOpen } = useChatSidebarContext()
</script>

<style scoped>
.sidebar-switch {
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
</style>
