<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  ExtensionCardAction,
  ExtensionManagerActionEvent,
  ExtensionManagerItem,
  ExtensionManagerNameClickEvent,
  ExtensionManagerRetryEvent,
  ExtensionManagerSection,
  ExtensionManagerSectionToggleEvent,
  ExtensionManagerTab,
  ExtensionManagerTabChangeEvent,
} from '../../../components/src/extension-manager/index.type'
import ExtensionManager from '../../../components/src/extension-manager/index.vue'

const props = withDefaults(
  defineProps<{
    defaultActiveTab?: string
    defaultExpanded?: boolean
  }>(),
  {
    defaultExpanded: undefined,
  },
)

const alphaActions: ExtensionCardAction[] = [
  { id: 'toggle-alpha', type: 'switch', label: 'Enable Alpha', checked: true },
  { id: 'inspect-alpha', type: 'button', label: 'Inspect Alpha' },
]

const createStateItems = (): ExtensionManagerItem[] => [{ id: 'state-item', name: 'State item' }]

const createTabs = (): ExtensionManagerTab[] => [
  {
    id: 'library',
    label: 'Library',
    badge: 3,
    sections: [
      {
        id: 'library-actions',
        title: 'Actionable extensions',
        items: [
          {
            id: 'alpha',
            name: 'Alpha extension',
            description: 'Alpha description',
            actions: alphaActions,
            primaryActionsLimit: 2,
            nameClickable: true,
          },
        ],
        collapsible: true,
        defaultExpanded: true,
      },
      {
        id: 'library-empty',
        title: 'Empty section',
        items: [],
        collapsible: true,
        defaultExpanded: false,
      },
      {
        id: 'library-state',
        title: 'State precedence',
        items: createStateItems(),
        collapsible: true,
        loading: true,
        error: 'Fixture load failed',
      },
    ],
  },
  {
    id: 'market',
    label: 'Marketplace',
    sections: [
      {
        id: 'market-main',
        title: 'Marketplace extensions',
        items: [{ id: 'beta', name: 'Beta extension', description: 'Beta description' }],
      },
      {
        id: 'market-empty',
        title: 'Marketplace empty',
        items: [],
        collapsible: true,
        defaultExpanded: true,
      },
      {
        id: 'market-loading',
        title: 'Marketplace loading',
        items: [],
        loading: true,
      },
      {
        id: 'market-error',
        title: 'Marketplace error',
        items: [],
        error: 'Marketplace unavailable',
      },
    ],
  },
]

const customTabs: ExtensionManagerTab[] = [
  {
    id: 'custom',
    label: 'Custom content',
    sections: [
      {
        id: 'custom-section',
        title: 'Custom items',
        items: [{ id: 'custom-alpha', name: 'Custom Alpha', description: 'Custom description' }],
      },
    ],
  },
]

const tabs = ref<ExtensionManagerTab[]>(createTabs())
const activeTab = ref<string | undefined>()
const expandedSections = ref<Record<string, boolean>>({})
const eventLog = ref<string[]>([])
const headerActionCount = ref(0)
const customManagerVisible = ref(false)

const sourceSnapshot = computed(() => JSON.stringify(tabs.value))

const record = (event: string) => {
  eventLog.value.push(event)
}

const handleActiveTabUpdate = (tabId: string | undefined) => {
  record(`update:active-tab:${tabId === undefined ? 'undefined' : tabId}`)
}

const handleExpandedSectionsUpdate = (value: Record<string, boolean>) => {
  record(`update:expanded-sections:${JSON.stringify(value)}`)
}

const handleTabChange = ({ tabId }: ExtensionManagerTabChangeEvent) => {
  record(`tab-change:${tabId}`)
}

const handleSectionToggle = ({ tabId, sectionId, expanded }: ExtensionManagerSectionToggleEvent) => {
  record(`section-toggle:${tabId}/${sectionId}/${expanded}`)
}

const handleAction = ({ tabId, sectionId, itemId, action }: ExtensionManagerActionEvent) => {
  const actionRecord = {
    id: action.id,
    type: action.type,
    ...(action.checked === undefined ? {} : { checked: action.checked }),
    ...(action.payload === undefined ? {} : { payload: action.payload }),
  }

  record(`action:${JSON.stringify({ tabId, sectionId, itemId, action: actionRecord })}`)
}

const handleNameClick = ({ tabId, sectionId, itemId, event }: ExtensionManagerNameClickEvent) => {
  record(`name-click:${JSON.stringify({ tabId, sectionId, itemId, event: { type: event.type } })}`)
}

const handleRetry = ({ tabId, sectionId }: ExtensionManagerRetryEvent) => {
  record(`retry:${tabId}/${sectionId}`)
}

const handleClose = () => {
  record('close')
}

const getSection = (sectionId: string): ExtensionManagerSection => {
  const section = tabs.value.flatMap((tab) => tab.sections).find(({ id }) => id === sectionId)
  if (!section) throw new Error(`Unknown fixture section: ${sectionId}`)
  return section
}

type PrecedenceState = 'loading' | 'error' | 'items' | 'empty'

const setPrecedenceState = (state: PrecedenceState) => {
  const section = getSection('library-state')
  section.loading = state === 'loading'
  section.error = state === 'loading' || state === 'error' ? 'Fixture load failed' : undefined
  section.items = state === 'empty' ? [] : createStateItems()
}

const removeActiveTab = () => {
  const tabId = activeTab.value ?? props.defaultActiveTab ?? 'library'
  tabs.value = tabs.value.filter((tab) => tab.id !== tabId)
}

const disableMarketTab = () => {
  tabs.value = tabs.value.map((tab) => (tab.id === 'market' ? { ...tab, disabled: true } : tab))
}

const enableMarketTab = () => {
  tabs.value = tabs.value.map((tab) => (tab.id === 'market' ? { ...tab, disabled: false } : tab))
}

const disableAllTabs = () => {
  tabs.value = tabs.value.map((tab) => ({ ...tab, disabled: true }))
}

const setExternalActiveTab = (tabId: string) => {
  activeTab.value = tabId
}

const setExternalExpandedSections = () => {
  expandedSections.value = {
    'library-actions': true,
    'library-empty': false,
    'library-state': true,
    'market-main': true,
  }
}
</script>

<template>
  <div data-testid="manager-host">
    <ExtensionManager
      :tabs="tabs"
      :default-active-tab="props.defaultActiveTab"
      :default-expanded="props.defaultExpanded"
      v-model:active-tab="activeTab"
      v-model:expanded-sections="expandedSections"
      title="Extension manager"
      show-close-button
      empty-text="No enabled tabs"
      @update:active-tab="handleActiveTabUpdate"
      @update:expanded-sections="handleExpandedSectionsUpdate"
      @tab-change="handleTabChange"
      @section-toggle="handleSectionToggle"
      @action="handleAction"
      @name-click="handleNameClick"
      @retry="handleRetry"
      @close="handleClose"
    >
      <template #header-actions>
        <button type="button" data-testid="header-action" @click="headerActionCount += 1">Header action</button>
      </template>

      <template #tab="{ tab, active, select }">
        <span :data-testid="`tab-slot-${tab.id}`" @click.stop="select">
          {{ tab.label }}<span v-if="active"> selected</span>
        </span>
      </template>

      <template #section-header="{ tab, section, expanded, toggle }">
        <button
          type="button"
          :data-testid="`section-header-${tab.id}-${section.id}`"
          :aria-expanded="expanded"
          @click.stop="toggle"
        >
          {{ section.title }}
        </button>
      </template>

      <template #loading="{ tab, section }">
        <div :data-testid="`loading-slot-${tab.id}-${section.id}`">Loading {{ section.title }}</div>
      </template>

      <template #error="{ tab, section, error, retry }">
        <div :data-testid="`error-slot-${tab.id}-${section.id}`">
          <span>{{ String(error) }}</span>
          <button type="button" :data-testid="`retry-${tab.id}-${section.id}`" @click.stop="retry">
            Retry {{ section.title }}
          </button>
        </div>
      </template>

      <template #empty="{ tab, section }">
        <div :data-testid="`empty-slot-${tab.id}-${section.id}`">Empty {{ section.title }}</div>
      </template>
    </ExtensionManager>
  </div>

  <div data-testid="controls">
    <button type="button" data-testid="remove-active-tab" @click="removeActiveTab">Remove active tab</button>
    <button type="button" data-testid="disable-market-tab" @click="disableMarketTab">Disable marketplace</button>
    <button type="button" data-testid="enable-market-tab" @click="enableMarketTab">Enable marketplace</button>
    <button type="button" data-testid="disable-all-tabs" @click="disableAllTabs">Disable all tabs</button>
    <button type="button" data-testid="set-active-library" @click="setExternalActiveTab('library')">
      Set active library
    </button>
    <button type="button" data-testid="set-active-market" @click="setExternalActiveTab('market')">
      Set active marketplace
    </button>
    <button type="button" data-testid="set-external-active-tab" @click="setExternalActiveTab('market')">
      Update active tab externally
    </button>
    <button type="button" data-testid="set-external-expanded-sections" @click="setExternalExpandedSections">
      Update expanded sections externally
    </button>
    <button type="button" data-testid="set-state-loading" @click="setPrecedenceState('loading')">
      Set loading state
    </button>
    <button type="button" data-testid="set-state-error" @click="setPrecedenceState('error')">Set error state</button>
    <button type="button" data-testid="set-state-items" @click="setPrecedenceState('items')">Set items state</button>
    <button type="button" data-testid="set-state-empty" @click="setPrecedenceState('empty')">Set empty state</button>
    <button type="button" data-testid="show-custom-item-manager" @click="customManagerVisible = true">
      Show custom item manager
    </button>
  </div>

  <output data-testid="active-tab-model">{{ activeTab ?? '' }}</output>
  <output data-testid="expanded-sections-model">{{ JSON.stringify(expandedSections) }}</output>
  <output data-testid="header-action-count">{{ headerActionCount }}</output>
  <output data-testid="event-log">{{ eventLog.join('|') }}</output>
  <output data-testid="source-snapshot">{{ sourceSnapshot }}</output>

  <div v-if="customManagerVisible" data-testid="custom-manager">
    <ExtensionManager :tabs="customTabs" :show-header="false">
      <template #item="{ tab, section, item, index }">
        <article
          :data-testid="`custom-rendered-${item.id}`"
          :data-slot-context="
            JSON.stringify({
              tabId: tab.id,
              tabLabel: tab.label,
              sectionId: section.id,
              sectionTitle: section.title,
              itemId: item.id,
              itemName: item.name,
              itemDescription: item.description,
              index,
            })
          "
        >
          <strong>Custom item: {{ item.name }}</strong>
          <output data-testid="custom-slot-context"> {{ tab.id }}/{{ section.id }}/{{ item.id }}/{{ index }} </output>
        </article>
      </template>
    </ExtensionManager>
  </div>
</template>
