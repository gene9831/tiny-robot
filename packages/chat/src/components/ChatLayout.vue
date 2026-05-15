<template>
  <div class="chat-layout" :class="`layout-${layout}`" :style="cssVars">
    <header class="header">
      <slot name="header">
        <component :is="slotsMap.header" />
      </slot>
    </header>
    <aside class="sidebar-left" :class="{ 'sidebar-open': sidebarLeftOpen, 'sidebar-closed': !sidebarLeftOpen }">
      <slot name="sidebar-left">
        <component :is="slotsMap['sidebar-left']" />
      </slot>
    </aside>
    <main class="main">
      <slot name="main">
        <component :is="slotsMap.main" />
      </slot>
    </main>
    <aside class="sidebar-right">
      <slot name="sidebar-right">
        <component :is="slotsMap['sidebar-right']" />
      </slot>
    </aside>
    <footer class="footer">
      <slot name="footer">
        <component :is="slotsMap.footer" />
      </slot>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots, type Component, type VNode } from 'vue'
import { ChatFooter, ChatHeader, ChatMain, ChatSidebar } from '.'
import { useChatSidebarContext } from '../context'

type SlotName = 'header' | 'main' | 'footer' | 'sidebar-left' | 'sidebar-right'

const props = withDefaults(
  defineProps<{
    layout?: 'left-right' | 'top-bottom'
    sidebarLeftWidth?: number
    sidebarLeftCloseWidth?: number
    transitionDuration?: string
  }>(),
  {
    layout: 'left-right',
    sidebarLeftWidth: 300,
    sidebarLeftCloseWidth: 48,
    transitionDuration: '0.2s',
  },
)

const cssVars = computed(() => ({
  '--sidebar-left-open-width': `${props.sidebarLeftWidth}px`,
  '--sidebar-left-close-width': `${props.sidebarLeftCloseWidth}px`,
  '--sidebar-left-transition-duration': props.transitionDuration,
}))

const slots = useSlots()

const slotsMap = computed(() => {
  const slotsMap: Record<SlotName, VNode | null> = {
    header: null,
    main: null,
    footer: null,
    'sidebar-left': null,
    'sidebar-right': null,
  }

  const defaultSlotVnodes = slots.default?.() || []

  console.log('Default slot VNodes:', defaultSlotVnodes) // Debug log to check the VNodes

  for (const vnode of defaultSlotVnodes) {
    const compName = typeof vnode.type === 'object' ? (vnode.type as Component).name : null

    if (compName === ChatHeader.name) {
      slotsMap.header = vnode
    } else if (compName === ChatMain.name) {
      slotsMap.main = vnode
    } else if (compName === ChatFooter.name) {
      slotsMap.footer = vnode
    } else if (compName === ChatSidebar.name) {
      const position = vnode.props?.position || 'left'
      const slotName = position === 'right' ? 'sidebar-right' : 'sidebar-left'
      slotsMap[slotName] = vnode
    }
  }

  return slotsMap
})

const { sidebarLeftOpen } = useChatSidebarContext()
</script>

<style scoped>
.chat-layout {
  display: grid;
  grid-template-columns: auto 1fr auto;
  height: 100vh;
  height: 100dvh;
}
.layout-top-bottom {
  grid-template-areas:
    'header header header'
    'sidebar-left main sidebar-right'
    'footer footer footer';
  grid-template-rows: auto 1fr auto;
}
.layout-left-right {
  grid-template-areas:
    'sidebar-left header sidebar-right'
    'sidebar-left main sidebar-right'
    'sidebar-left footer sidebar-right';
  grid-template-rows: auto 1fr auto;
}
.header {
  grid-area: header;
  background: #f0f0f0;
  padding: 8px;
}
.sidebar-left {
  grid-area: sidebar-left;
  background: #fafafa;
  padding: 0;
  width: var(--sidebar-left-open-width);
  transition: width var(--sidebar-left-transition-duration) ease;
  overflow: hidden;
}
.sidebar-left.sidebar-closed {
  width: var(--sidebar-left-close-width);
}
.main {
  grid-area: main;
  background: #fff;
  padding: 8px;
  overflow-y: auto;
}
.sidebar-right {
  grid-area: sidebar-right;
  background: #fafafa;
  padding: 8px;
}
.footer {
  grid-area: footer;
  background: #f0f0f0;
  padding: 8px;
}
</style>
