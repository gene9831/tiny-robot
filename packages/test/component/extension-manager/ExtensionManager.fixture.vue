<script setup lang="ts">
import { ref } from 'vue'
import type {
  ExtensionCardAction,
  ExtensionManagerActionEvent,
  ExtensionManagerNameClickEvent,
  ExtensionManagerSectionToggleEvent,
  ExtensionManagerTab,
} from '../../../components/src/extension-manager/index.type'
import ExtensionManager from '../../../components/src/extension-manager/index.vue'

const alphaActions: ExtensionCardAction[] = [
  { id: 'toggle-alpha', type: 'switch', label: 'Enable Alpha', checked: true },
  { id: 'inspect-alpha', type: 'button', label: 'Inspect Alpha' },
]

const createTabs = (): ExtensionManagerTab[] => [
  {
    id: 'library',
    label: 'Library tab',
    items: [
      {
        id: 'alpha',
        name: 'Alpha extension',
        description: 'Alpha description',
        installed: true,
        actions: alphaActions,
        primaryActionsLimit: 2,
        nameClickable: true,
      },
      {
        id: 'beta',
        name: 'Beta extension',
        description: 'Beta description',
        installed: false,
      },
      {
        id: 'gamma',
        name: 'Gamma extension',
        description: 'Gamma description',
      },
    ],
  },
  {
    id: 'market',
    label: 'Market tab',
    items: [{ id: 'delta', name: 'Delta extension', installed: true }],
  },
]

const tabs = ref<ExtensionManagerTab[]>(createTabs())
const activeTab = ref<string | undefined>('library')
const eventLog = ref<string[]>([])
const showItemSlotManager = ref(false)

const record = (event: string) => eventLog.value.push(event)

const handleActiveTabUpdate = (tabId: string | undefined) => {
  record('update:active-tab:' + (tabId ?? 'undefined'))
}

const handleTabChange = ({ tabId }: { tabId: string }) => {
  record('tab-change:' + tabId)
}

const handleSectionToggle = ({ tabId, sectionKey, expanded }: ExtensionManagerSectionToggleEvent) => {
  record('section-toggle:' + tabId + '/' + sectionKey + '/' + expanded)
}

const handleAction = ({ tabId, sectionKey, itemId, action }: ExtensionManagerActionEvent) => {
  const actionRecord = {
    id: action.id,
    type: action.type,
    ...(action.checked === undefined ? {} : { checked: action.checked }),
    ...(action.payload === undefined ? {} : { payload: action.payload }),
  }

  record('action:' + JSON.stringify({ tabId, sectionKey, itemId, action: actionRecord }))
}

const handleNameClick = ({ tabId, sectionKey, itemId, event }: ExtensionManagerNameClickEvent) => {
  record('name-click:' + JSON.stringify({ tabId, sectionKey, itemId, event: { type: event.type } }))
}

const installBeta = () => {
  tabs.value = tabs.value.map((tab) => ({
    ...tab,
    items: tab.items.map((item) => (item.id === 'beta' ? { ...item, installed: true } : item)),
  }))
}

const setExternalActiveTab = (tabId: string) => {
  activeTab.value = tabId
}
</script>

<template>
  <div data-testid="manager-host">
    <ExtensionManager
      :tabs="tabs"
      v-model:active-tab="activeTab"
      title="Extension manager"
      @update:active-tab="handleActiveTabUpdate"
      @tab-change="handleTabChange"
      @section-toggle="handleSectionToggle"
      @action="handleAction"
      @name-click="handleNameClick"
    >
      <template #empty="{ tab, sectionKey, title }">
        <span :data-testid="'empty-slot-' + tab.id + '-' + sectionKey">Empty {{ sectionKey }}</span>
        <span :data-testid="'empty-slot-context-' + tab.id + '-' + sectionKey">
          {{ tab.id }}/{{ sectionKey }}/{{ title }}
        </span>
      </template>
    </ExtensionManager>
  </div>

  <button type="button" data-testid="set-active-market" @click="setExternalActiveTab('market')">
    Set active market
  </button>
  <button type="button" data-testid="set-active-library" @click="setExternalActiveTab('library')">
    Set active library
  </button>
  <button type="button" data-testid="install-beta" @click="installBeta">Install beta</button>
  <button type="button" data-testid="show-item-slot-manager" @click="showItemSlotManager = true">
    Show item slot manager
  </button>

  <div v-if="showItemSlotManager" data-testid="item-slot-manager">
    <ExtensionManager :tabs="tabs">
      <template #item="{ item }">
        <span data-testid="item-slot-context">{{ 'installed' in item }}</span>
      </template>
    </ExtensionManager>
  </div>

  <output data-testid="event-log">{{ eventLog.join('|') }}</output>
</template>
