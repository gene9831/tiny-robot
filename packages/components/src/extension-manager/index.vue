<script setup lang="ts">
import { IconClose } from '@opentiny/tiny-robot-svgs'
import { computed, useId } from 'vue'
import { useExtensionManagerState } from './composables/useExtensionManagerState'
import ExtensionManagerSection from './components/ExtensionManagerSection.vue'
import ExtensionManagerTabs from './components/ExtensionManagerTabs.vue'
import type {
  ExtensionCardGridActionEvent,
  ExtensionCardGridNameClickEvent,
  ExtensionCardGridItem,
  ExtensionManagerEmits,
  ExtensionManagerExpandedSections,
  ExtensionManagerItem,
  ExtensionManagerProps,
  ExtensionManagerSection as ExtensionManagerSectionData,
  ExtensionManagerSectionKey,
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

const SECTION_DEFINITIONS: readonly {
  key: ExtensionManagerSectionKey
  title: string
}[] = [
  { key: 'installed', title: '已安装' },
  { key: 'available', title: '可安装' },
]

const encodeSectionPart = (value: string) => value.length + ':' + value

const getSectionStateKey = (tabId: string, sectionKey: ExtensionManagerSectionKey) =>
  'extension-manager/section/' + encodeSectionPart(tabId) + '/' + encodeSectionPart(sectionKey)

const managerId = useId()
const managerIdPrefix = 'extension-manager-' + managerId
const getTabDomId = (tabId: string) => managerIdPrefix + '-tab-' + encodeSectionPart(tabId)
const getTabPanelDomId = (tabId: string) => managerIdPrefix + '-tabpanel-' + encodeSectionPart(tabId)

const stateEmit = ((event: string, payload?: unknown) => {
  switch (event) {
    case 'update:active-tab':
      emit('update:active-tab', payload as string | undefined)
      break
    case 'tab-change':
      emit('tab-change', payload as { tabId: string })
      break
    case 'update:expanded-sections':
      emit('update:expanded-sections', payload as ExtensionManagerExpandedSections)
      break
    case 'section-toggle':
      emit('section-toggle', payload as { tabId: string; sectionKey: ExtensionManagerSectionKey; expanded: boolean })
      break
  }
}) as unknown as ExtensionManagerEmits

const { activeTab, activeTabId, selectTab, isSectionExpanded, toggleSection } = useExtensionManagerState(
  props,
  stateEmit,
)

const hasActiveTab = computed(() => activeTab.value !== undefined)

const toCardGridItem = (item: ExtensionManagerItem): ExtensionCardGridItem => {
  const { installed, ...cardItem } = item

  void installed
  return cardItem
}

const activeSections = computed<ExtensionManagerSectionData[]>(() => {
  const items = activeTab.value?.items ?? []

  return SECTION_DEFINITIONS.map(({ key, title }) => ({
    key,
    title,
    columns: props.columns,
    items: items.filter((item) => (item.installed === true ? 'installed' : 'available') === key).map(toCardGridItem),
  }))
})

const getSectionExpanded = (tabId: string, sectionKey: ExtensionManagerSectionKey) =>
  isSectionExpanded(tabId, sectionKey)

const handleClose = () => emit('close')

const handleSectionToggle = (tabId: string, sectionKey: ExtensionManagerSectionKey) => {
  if (activeTab.value?.id !== tabId) return

  toggleSection(tabId, sectionKey)
}

const handleAction = (tabId: string, sectionKey: ExtensionManagerSectionKey, event: ExtensionCardGridActionEvent) => {
  emit('action', {
    tabId,
    sectionKey,
    itemId: event.itemId,
    action: event.action,
  })
}

const handleNameClick = (
  tabId: string,
  sectionKey: ExtensionManagerSectionKey,
  event: ExtensionCardGridNameClickEvent,
) => {
  emit('name-click', {
    tabId,
    sectionKey,
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

    <ExtensionManagerTabs
      :tabs="props.tabs"
      :active-tab-id="activeTabId"
      :id-prefix="managerIdPrefix"
      @select="selectTab"
    >
      <template v-if="slots.tab" #tab="{ tab, active, select }">
        <slot name="tab" :tab="tab" :active="active" :select="select" />
      </template>
    </ExtensionManagerTabs>

    <div
      v-if="hasActiveTab"
      class="extension-manager__sections"
      role="tabpanel"
      :id="getTabPanelDomId(activeTabId!)"
      :aria-labelledby="getTabDomId(activeTabId!)"
    >
      <ExtensionManagerSection
        v-for="section in activeSections"
        :key="getSectionStateKey(activeTabId!, section.key)"
        :tab-id="activeTabId!"
        :section="section"
        :expanded="getSectionExpanded(activeTabId!, section.key)"
        @section-toggle="handleSectionToggle(activeTabId!, section.key)"
        @action="handleAction(activeTabId!, section.key, $event)"
        @name-click="handleNameClick(activeTabId!, section.key, $event)"
      >
        <template v-if="slots['section-header']" #section-header="{ section: sectionValue, expanded, toggle, count }">
          <slot
            name="section-header"
            :tab="activeTab!"
            :section="sectionValue"
            :expanded="expanded"
            :toggle="toggle"
            :count="count"
          />
        </template>

        <template v-if="slots.item" #item="{ item, index }">
          <slot name="item" :tab="activeTab!" :section="section" :item="item" :index="index" />
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
