<script setup lang="ts">
import type { ComponentPublicInstance, VNode } from 'vue'
import { computed, nextTick } from 'vue'
import type { ExtensionManagerTab } from '../index.type'

defineOptions({ name: 'ExtensionManagerTabs' })

const props = defineProps<{
  tabs: ExtensionManagerTab[]
  activeTabId?: string
}>()

const emit = defineEmits<{
  (e: 'select', tabId: string): void
}>()

const slots = defineSlots<{
  tab?: (props: { tab: ExtensionManagerTab; active: boolean; select: () => void }) => VNode[]
}>()

const tabElements = new Map<string, HTMLButtonElement>()

const setTabRef = (tabId: string, target: Element | ComponentPublicInstance | null) => {
  const element = target instanceof Element ? target : target?.$el

  if (element instanceof HTMLButtonElement) tabElements.set(tabId, element)
  else tabElements.delete(tabId)
}

const enabledTabs = computed(() => props.tabs.filter((tab) => !tab.disabled))
const activeEnabledTabId = computed(() =>
  enabledTabs.value.some((tab) => tab.id === props.activeTabId) ? props.activeTabId : enabledTabs.value[0]?.id,
)

const selectTab = (tabId: string) => {
  const tab = props.tabs.find((candidate) => candidate.id === tabId)
  if (!tab || tab.disabled) return

  emit('select', tab.id)
}

const focusTab = (tabId: string) => {
  void nextTick(() => tabElements.get(tabId)?.focus())
}

const getWrappedIndex = (index: number, length: number) => ((index % length) + length) % length

const getAdjacentEnabledTabId = (tabId: string, direction: -1 | 1) => {
  const tabs = props.tabs
  if (tabs.length === 0 || enabledTabs.value.length === 0) return undefined

  const currentIndex = tabs.findIndex((tab) => tab.id === tabId)
  const startingIndex = currentIndex >= 0 ? currentIndex : direction === 1 ? -1 : 0

  for (let offset = 1; offset <= tabs.length; offset += 1) {
    const candidate = tabs[getWrappedIndex(startingIndex + direction * offset, tabs.length)]
    if (candidate && !candidate.disabled) return candidate.id
  }

  return undefined
}

const getBoundaryEnabledTabId = (boundary: 'first' | 'last') => {
  const tabs = enabledTabs.value
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
      nextTabId = getAdjacentEnabledTabId(tabId, -1)
      break
    case 'ArrowRight':
      nextTabId = getAdjacentEnabledTabId(tabId, 1)
      break
    case 'Home':
      nextTabId = getBoundaryEnabledTabId('first')
      break
    case 'End':
      nextTabId = getBoundaryEnabledTabId('last')
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
      :aria-selected="tab.id === activeEnabledTabId"
      :aria-disabled="tab.disabled ? 'true' : undefined"
      :tabindex="tab.id === activeEnabledTabId ? 0 : -1"
      @click="selectTab(tab.id)"
      @keydown="handleKeydown(tab.id, $event)"
    >
      <template v-if="slots.tab">
        <slot name="tab" :tab="tab" :active="tab.id === activeEnabledTabId" :select="() => selectTab(tab.id)" />
      </template>
      <template v-else>{{ tab.label }}</template>
      <span v-if="tab.badge !== undefined" class="extension-manager-tabs__badge">{{ tab.badge }}</span>
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

.extension-manager-tabs__tab[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.5;
}

.extension-manager-tabs__tab:focus-visible {
  outline: 2px solid var(--tr-color-primary);
  outline-offset: 2px;
}

.extension-manager-tabs__badge {
  color: var(--tr-text-tertiary);
  font-size: 12px;
  font-weight: 400;
}
</style>
