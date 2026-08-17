<script setup lang="ts">
import type { ComponentPublicInstance, VNode } from 'vue'
import { computed, nextTick } from 'vue'
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

const setTabRef = (tabId: string, target: Element | ComponentPublicInstance | null) => {
  const element = target instanceof Element ? target : target?.$el

  if (element instanceof HTMLButtonElement) tabElements.set(tabId, element)
  else tabElements.delete(tabId)
}

const activeTabId = computed(() =>
  props.tabs.some((tab) => tab.id === props.activeTabId) ? props.activeTabId : props.tabs[0]?.id,
)

const selectTab = (tabId: string) => {
  const tab = props.tabs.find((candidate) => candidate.id === tabId)
  if (!tab) return

  emit('select', tab.id)
}

const focusTab = (tabId: string) => {
  void nextTick(() => tabElements.get(tabId)?.focus())
}

const getWrappedIndex = (index: number, length: number) => ((index % length) + length) % length

const getAdjacentTabId = (tabId: string, direction: -1 | 1) => {
  const tabs = props.tabs
  if (tabs.length === 0) return undefined

  const currentIndex = tabs.findIndex((tab) => tab.id === tabId)
  const startingIndex = currentIndex >= 0 ? currentIndex : direction === 1 ? -1 : 0

  for (let offset = 1; offset <= tabs.length; offset += 1) {
    const candidate = tabs[getWrappedIndex(startingIndex + direction * offset, tabs.length)]
    if (candidate) return candidate.id
  }

  return undefined
}

const getBoundaryTabId = (boundary: 'first' | 'last') => {
  const tabs = props.tabs
  return boundary === 'first' ? tabs[0]?.id : tabs.at(-1)?.id
}

const handleKeydown = (tabId: string, event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectTab(tabId)
    return
  }

  let nextTabId: string | undefined

  switch (event.key) {
    case 'ArrowLeft':
      nextTabId = getAdjacentTabId(tabId, -1)
      break
    case 'ArrowRight':
      nextTabId = getAdjacentTabId(tabId, 1)
      break
    case 'Home':
      nextTabId = getBoundaryTabId('first')
      break
    case 'End':
      nextTabId = getBoundaryTabId('last')
      break
    default:
      return
  }

  if (nextTabId === undefined) return

  event.preventDefault()
  selectTab(nextTabId)
  focusTab(nextTabId)
}
</script>

<template>
  <div class="extension-manager-tabs" role="tablist" aria-orientation="horizontal">
    <button
      v-for="tab in props.tabs"
      :key="tab.id"
      :ref="(element) => setTabRef(tab.id, element as Element | ComponentPublicInstance | null)"
      class="extension-manager-tabs__tab"
      type="button"
      role="tab"
      :id="getTabDomId(tab.id)"
      :aria-selected="tab.id === activeTabId"
      :aria-controls="getTabPanelDomId(tab.id)"
      :tabindex="tab.id === activeTabId ? 0 : -1"
      @click="selectTab(tab.id)"
      @keydown="handleKeydown(tab.id, $event)"
    >
      <template v-if="slots.tab">
        <span class="extension-manager-tabs__slot" @click.stop>
          <slot name="tab" :tab="tab" :active="tab.id === activeTabId" :select="() => selectTab(tab.id)" />
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
