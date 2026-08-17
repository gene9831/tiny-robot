<script setup lang="ts">
import type { VNode } from 'vue'
import { nextTick } from 'vue'
import type { ExtensionManagerTab } from '../index.type'

defineOptions({ name: 'ExtensionManagerTabs' })

const props = defineProps<{
  tabs: ExtensionManagerTab[]
  activeTabId?: string
  idPrefix: string
}>()

const emit = defineEmits<{
  (e: 'select', tabId: string): void
}>()

const slots = defineSlots<{
  tab?: (props: { tab: ExtensionManagerTab; active: boolean; select: () => void }) => VNode[]
}>()

const encodeTabPart = (value: string) => `${value.length}:${value}`
const getTabDomId = (tabId: string) => `${props.idPrefix}-tab-${encodeTabPart(tabId)}`
const getTabPanelDomId = (tabId: string) => `${props.idPrefix}-tabpanel-${encodeTabPart(tabId)}`

const tabElements = new Map<string, HTMLButtonElement>()

const setTabRef = (tabId: string, element: HTMLButtonElement | null) => {
  if (element) tabElements.set(tabId, element)
  else tabElements.delete(tabId)
}

const selectTab = (tabId: string) => emit('select', tabId)

const focusTab = (tabId: string) => {
  void nextTick(() => tabElements.get(tabId)?.focus())
}

const handleKeydown = (tabIndex: number, event: KeyboardEvent) => {
  let nextIndex: number

  switch (event.key) {
    case 'ArrowLeft':
      nextIndex = (tabIndex - 1 + props.tabs.length) % props.tabs.length
      break
    case 'ArrowRight':
      nextIndex = (tabIndex + 1) % props.tabs.length
      break
    case 'Home':
      nextIndex = 0
      break
    case 'End':
      nextIndex = props.tabs.length - 1
      break
    default:
      return
  }

  const nextTab = props.tabs[nextIndex]
  if (!nextTab) return

  event.preventDefault()
  selectTab(nextTab.id)
  focusTab(nextTab.id)
}
</script>

<template>
  <div class="extension-manager-tabs" role="tablist" aria-orientation="horizontal">
    <button
      v-for="(tab, index) in props.tabs"
      :key="tab.id"
      :ref="(element) => setTabRef(tab.id, element as HTMLButtonElement | null)"
      class="extension-manager-tabs__tab"
      type="button"
      role="tab"
      :id="getTabDomId(tab.id)"
      :aria-selected="tab.id === props.activeTabId"
      :aria-controls="getTabPanelDomId(tab.id)"
      :tabindex="tab.id === props.activeTabId ? 0 : -1"
      @click="selectTab(tab.id)"
      @keydown="handleKeydown(index, $event)"
    >
      <template v-if="slots.tab">
        <span class="extension-manager-tabs__slot" @click.stop>
          <slot name="tab" :tab="tab" :active="tab.id === props.activeTabId" :select="() => selectTab(tab.id)" />
        </span>
      </template>
      <template v-else>{{ tab.label }}</template>
    </button>
  </div>
</template>

<style lang="less" scoped>
.extension-manager-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
}

.extension-manager-tabs__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 4px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--tr-text-secondary);
  cursor: pointer;
  font: inherit;
}

.extension-manager-tabs__tab[aria-selected='true'] {
  color: var(--tr-text-primary);
  font-weight: 600;
}

.extension-manager-tabs__tab:focus-visible {
  outline: 2px solid var(--tr-color-primary);
  outline-offset: 2px;
}
</style>
