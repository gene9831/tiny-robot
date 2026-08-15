<script setup lang="ts">
import { IconClose } from '@opentiny/tiny-robot-svgs'
import { computed } from 'vue'
import { useExtensionManagerState } from './composables/useExtensionManagerState'
import ExtensionManagerSection from './components/ExtensionManagerSection.vue'
import ExtensionManagerTabs from './components/ExtensionManagerTabs.vue'
import type {
  ExtensionCardGridActionEvent,
  ExtensionCardGridNameClickEvent,
  ExtensionManagerEmits,
  ExtensionManagerProps,
  ExtensionManagerSection as ExtensionManagerSectionData,
  ExtensionManagerSlots,
} from './index.type'

defineOptions({ name: 'ExtensionManager' })

const props = withDefaults(defineProps<ExtensionManagerProps>(), {
  showHeader: true,
  showCloseButton: false,
  defaultExpanded: true,
  emptyText: '暂无内容',
})

const emit = defineEmits<ExtensionManagerEmits>()
const slots = defineSlots<ExtensionManagerSlots>()

type SectionIdentity = {
  tabId: string
  sectionId: string
  stateKey: string
  publicKey: string
}

const hasOwn = (record: Record<string, boolean>, key: string) => Object.prototype.hasOwnProperty.call(record, key)

const setRecordValue = (record: Record<string, boolean>, key: string, value: boolean) => {
  Object.defineProperty(record, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  })
}

const encodeSectionPart = (value: string) => `${value.length}:${value}`

const getSectionStateKey = (tabId: string, sectionId: string) =>
  `extension-manager/section/${encodeSectionPart(tabId)}/${encodeSectionPart(sectionId)}`

const getSectionPublicKey = (tabId: string, sectionId: string): string => {
  const sectionIdCounts = new Map<string, number>()
  const entries: SectionIdentity[] = []

  for (const tab of props.tabs) {
    for (const section of tab.sections) {
      sectionIdCounts.set(section.id, (sectionIdCounts.get(section.id) ?? 0) + 1)
      entries.push({
        tabId: tab.id,
        sectionId: section.id,
        stateKey: getSectionStateKey(tab.id, section.id),
        publicKey: '',
      })
    }
  }

  const stateKeys = new Set(entries.map((entry) => entry.stateKey))
  const usedPublicKeys = new Set<string>()

  for (const entry of entries) {
    const canUseSectionId =
      sectionIdCounts.get(entry.sectionId) === 1 &&
      !stateKeys.has(entry.sectionId) &&
      !usedPublicKeys.has(entry.sectionId)
    const publicKey = canUseSectionId ? entry.sectionId : entry.stateKey

    usedPublicKeys.add(publicKey)

    if (entry.tabId === tabId && entry.sectionId === sectionId) return publicKey
  }

  return sectionId
}

let pendingSectionToggle: { tabId: string; sectionId: string } | undefined

const normalizeControlledExpandedSections = (next: Record<string, boolean>) => {
  const current = props.expandedSections
  const pending = pendingSectionToggle

  if (current === undefined || pending === undefined) return next

  const publicKey = getSectionPublicKey(pending.tabId, pending.sectionId)
  const normalized: Record<string, boolean> = {}

  for (const [key, value] of Object.entries(current)) {
    if (hasOwn(next, key)) setRecordValue(normalized, key, next[key] ?? value)
  }

  if (hasOwn(next, publicKey)) setRecordValue(normalized, publicKey, next[publicKey]!)

  return normalized
}

const stateEmit = ((event: string, payload?: unknown) => {
  switch (event) {
    case 'update:active-tab':
      emit('update:active-tab', payload as string | undefined)
      break
    case 'tab-change':
      emit('tab-change', payload as { tabId: string })
      break
    case 'update:expanded-sections':
      emit('update:expanded-sections', normalizeControlledExpandedSections(payload as Record<string, boolean>))
      break
    case 'section-toggle':
      emit('section-toggle', payload as { tabId: string; sectionId: string; expanded: boolean })
      break
  }
}) as unknown as ExtensionManagerEmits

const { activeTab, activeTabId, selectTab, isSectionExpanded, toggleSection } = useExtensionManagerState(
  props,
  stateEmit,
)

const hasActiveTab = computed(() => activeTab.value !== undefined)

const getSectionExpanded = (
  tabId: string,
  sectionId: string,
  section: (typeof props.tabs)[number]['sections'][number],
) => {
  return isSectionExpanded(tabId, sectionId, section)
}

const handleClose = () => emit('close')

const handleSectionToggle = (tabId: string, section: ExtensionManagerSectionData) => {
  if (activeTab.value?.id !== tabId) return

  pendingSectionToggle = { tabId, sectionId: section.id }
  toggleSection(tabId, section)
  pendingSectionToggle = undefined
}

const handleRetry = (tabId: string, sectionId: string) => {
  emit('retry', { tabId, sectionId })
}

const handleAction = (tabId: string, sectionId: string, event: ExtensionCardGridActionEvent) => {
  emit('action', {
    tabId,
    sectionId,
    itemId: event.itemId,
    action: event.action,
  })
}

const handleNameClick = (tabId: string, sectionId: string, event: ExtensionCardGridNameClickEvent) => {
  emit('name-click', {
    tabId,
    sectionId,
    itemId: event.itemId,
    event: event.event,
  })
}
</script>

<template>
  <div class="extension-manager">
    <div v-if="props.showHeader" class="extension-manager__header">
      <div v-if="props.title" class="extension-manager__title">{{ props.title }}</div>
      <div class="extension-manager__header-actions">
        <slot v-if="slots['header-actions']" name="header-actions" />
        <button
          v-if="props.showCloseButton"
          class="extension-manager__close"
          type="button"
          aria-label="Close"
          @click="handleClose"
        >
          <IconClose />
        </button>
      </div>
    </div>

    <ExtensionManagerTabs :tabs="props.tabs" :active-tab-id="activeTabId" @select="selectTab">
      <template v-if="slots.tab" #tab="{ tab, active, select }">
        <slot name="tab" :tab="tab" :active="active" :select="select" />
      </template>
    </ExtensionManagerTabs>

    <div v-if="hasActiveTab" class="extension-manager__sections">
      <ExtensionManagerSection
        v-for="section in activeTab?.sections"
        :key="getSectionStateKey(activeTabId!, section.id)"
        :tab-id="activeTabId!"
        :section="section"
        :expanded="getSectionExpanded(activeTabId!, section.id, section)"
        @section-toggle="handleSectionToggle(activeTabId!, section)"
        @retry="handleRetry(activeTabId!, section.id)"
        @action="handleAction(activeTabId!, section.id, $event)"
        @name-click="handleNameClick(activeTabId!, section.id, $event)"
      >
        <template v-if="slots['section-header']" #section-header="{ section: sectionValue, expanded, toggle }">
          <slot name="section-header" :tab="activeTab!" :section="sectionValue" :expanded="expanded" :toggle="toggle" />
        </template>

        <template v-if="slots.item" #item="{ item, index }">
          <slot name="item" :tab="activeTab!" :section="section" :item="item" :index="index" />
        </template>

        <template v-if="slots.loading" #loading>
          <slot name="loading" :tab="activeTab!" :section="section" />
        </template>

        <template v-if="slots.error" #error="{ error, retry }">
          <slot name="error" :tab="activeTab!" :section="section" :error="error" :retry="retry" />
        </template>

        <template v-if="slots.empty" #empty>
          <slot name="empty" :tab="activeTab!" :section="section" />
        </template>
      </ExtensionManagerSection>
    </div>

    <div v-else class="extension-manager__empty">{{ props.emptyText }}</div>
  </div>
</template>

<style lang="less" scoped>
.extension-manager {
  box-sizing: border-box;
  width: 100%;
  max-width: 820px;
  padding: 24px;
  background: var(--tr-container-bg-default);
  border: 1px solid var(--tr-mcp-server-picker-border-color-default);
  border-radius: 12px;
  color: var(--tr-text-primary);
}

.extension-manager__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.extension-manager__title {
  font-size: 16px;
  font-weight: 600;
}

.extension-manager__header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.extension-manager__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 28px;
  height: 28px;
  padding: 5px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.extension-manager__close:hover {
  background: var(--tr-mcp-server-picker-bg-hover);
}

.extension-manager__sections {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 18px;
}

.extension-manager__empty {
  padding: 32px 0;
  color: var(--tr-text-secondary);
  font-size: 13px;
  text-align: center;
}

@media (max-width: 640px) {
  .extension-manager {
    padding: 18px;
  }

  .extension-manager__header {
    align-items: stretch;
    flex-direction: column;
  }

  .extension-manager__header-actions {
    justify-content: space-between;
  }
}
</style>
