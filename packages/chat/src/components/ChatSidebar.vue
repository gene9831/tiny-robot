<template>
  <div
    class="chat-sidebar"
    :class="{
      'sidebar-left': sidebarLeft,
      'sidebar-right': !sidebarLeft,
      'sidebar-open': sidebarOpen,
      'sidebar-closed': !sidebarOpen,
      'sidebar-slide': collapseMode === 'slide' && !sidebarOpen,
    }"
  >
    <slot :sidebar-left="sidebarLeft" :sidebar-open="sidebarOpen"></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, type VNode } from 'vue'
import { useChatSidebarContext } from '../context'

defineOptions({
  name: 'TinyRobotChatSidebar',
})

interface Slots {
  default(slotProps: { sidebarLeft: boolean; sidebarOpen: boolean }): Array<VNode>
}

defineSlots<Slots>()

const props = withDefaults(
  defineProps<{
    position?: 'left' | 'right'
    collapseMode?: 'overlay' | 'slide'
  }>(),
  {
    position: 'left',
    collapseMode: 'overlay',
  },
)

const { sidebarLeftOpen } = useChatSidebarContext()

const sidebarLeft = computed(() => props.position === 'left')
const sidebarOpen = computed(() => Boolean(sidebarLeftOpen.value))
</script>

<style scoped>
.sidebar-left {
  width: var(--sidebar-left-open-width);
  transition: right var(--sidebar-left-transition-duration) ease;

  position: relative;
  right: 0;
}
.sidebar-slide {
  right: calc(var(--sidebar-left-open-width) - var(--sidebar-left-close-width));
}
</style>
