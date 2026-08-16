<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  ExtensionCardAction,
  ExtensionCardActionEvent,
  ExtensionManagerActionEvent,
  ExtensionManagerNameClickEvent,
  ExtensionManagerSectionToggleEvent,
  ExtensionManagerTab,
} from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'

const activeTab = ref('workspace')
const alphaInstalled = ref(true)
const isClosed = ref(false)
const lastEvent = ref<Record<string, unknown>>()
const eventHistory = ref<Record<string, unknown>[]>([])
const headerActionCount = ref(0)

const alphaActions = computed<ExtensionCardAction[]>(() => [
  {
    id: 'toggle-alpha',
    type: 'switch',
    label: alphaInstalled.value ? 'Uninstall Alpha' : 'Install Alpha',
    checked: alphaInstalled.value,
  },
  { id: 'inspect-alpha', type: 'button', label: 'Inspect Alpha' },
])

const tabs = computed<ExtensionManagerTab[]>(() => [
  {
    id: 'workspace',
    label: 'Workspace',
    badge: 2,
    tags: [
      { value: 'local', label: 'Local' },
      { value: 'featured', label: 'Featured' },
    ],
    items: [
      {
        id: 'alpha',
        name: 'Alpha extension',
        description: 'Changing the switch moves this item between the derived sections.',
        installed: alphaInstalled.value,
        actions: alphaActions.value,
        primaryActionsLimit: 2,
        nameClickable: true,
        tags: ['local', 'featured'],
      },
      {
        id: 'gamma',
        name: 'Gamma extension',
        description: 'An available extension that keeps the original item order.',
        tags: ['local'],
      },
    ],
  },
  {
    id: 'catalog',
    label: 'Catalog',
    badge: 1,
    tags: [
      { value: 'remote', label: 'Remote' },
      { value: 'recommended', label: 'Recommended' },
    ],
    items: [
      {
        id: 'beta',
        name: 'Beta extension',
        description: 'The second tab has its own installed and available sections.',
        installed: false,
        nameClickable: true,
        tags: ['remote', 'recommended'],
      },
    ],
  },
  {
    id: 'empty',
    label: 'Empty',
    items: [],
  },
])

const eventOutput = computed(() =>
  lastEvent.value === undefined
    ? 'Interact with a card, tab, section, or header action.'
    : JSON.stringify(lastEvent.value, null, 2),
)

const recordEvent = (event: Record<string, unknown>) => {
  lastEvent.value = event
  eventHistory.value = [event, ...eventHistory.value].slice(0, 5)
}

const serializeAction = (action: ExtensionCardActionEvent) => ({
  id: action.id,
  type: action.type,
  ...(action.checked === undefined ? {} : { checked: action.checked }),
  ...(action.payload === undefined ? {} : { payload: action.payload }),
})

const handleAction = ({ tabId, sectionKey, itemId, action }: ExtensionManagerActionEvent) => {
  if (itemId === 'alpha' && action.id === 'toggle-alpha' && typeof action.checked === 'boolean') {
    alphaInstalled.value = action.checked
  }

  recordEvent({
    type: 'action',
    tabId,
    sectionKey,
    itemId,
    action: serializeAction(action),
  })
}

const handleNameClick = ({ tabId, sectionKey, itemId, event }: ExtensionManagerNameClickEvent) => {
  recordEvent({
    type: 'name-click',
    tabId,
    sectionKey,
    itemId,
    event: { type: event.type },
  })
}

const handleTabChange = ({ tabId }: { tabId: string }) => {
  recordEvent({ type: 'tab-change', tabId })
}

const handleSectionToggle = ({ tabId, sectionKey, expanded }: ExtensionManagerSectionToggleEvent) => {
  recordEvent({ type: 'section-toggle', tabId, sectionKey, expanded })
}

const handleHeaderAction = () => {
  headerActionCount.value += 1
  recordEvent({ type: 'header-action', count: headerActionCount.value })
}

const handleClose = () => {
  isClosed.value = true
  recordEvent({ type: 'close' })
}
</script>

<template>
  <div class="storybook-manager-playground">
    <div class="storybook-manager-playground__controls">
      <label>
        Active tab
        <select v-model="activeTab" aria-label="Active tab">
          <option value="workspace">Workspace</option>
          <option value="catalog">Catalog</option>
          <option value="empty">Empty (no tags)</option>
        </select>
      </label>
      <button type="button" @click="handleHeaderAction">Header action</button>
      <span>{{ headerActionCount }} header actions</span>
    </div>

    <p v-if="isClosed" class="storybook-manager-playground__closed">Manager closed. Reopen the story to reset it.</p>

    <ExtensionManager
      v-else
      v-model:active-tab="activeTab"
      :tabs="tabs"
      title="Extension manager playground"
      :columns="1"
      show-close-button
      @tab-change="handleTabChange"
      @section-toggle="handleSectionToggle"
      @action="handleAction"
      @name-click="handleNameClick"
      @close="handleClose"
    >
      <template #header-actions>
        <button type="button" @click="handleHeaderAction">Header action</button>
      </template>

      <template #empty="{ title }">
        <span>{{ title }} is empty.</span>
      </template>
    </ExtensionManager>

    <aside class="storybook-manager-playground__events">
      <strong>Last event</strong>
      <pre>{{ eventOutput }}</pre>
      <strong>Recent events</strong>
      <ul>
        <li v-for="(event, index) in eventHistory" :key="index">{{ JSON.stringify(event) }}</li>
      </ul>
    </aside>
  </div>
</template>

<style scoped>
.storybook-manager-playground {
  display: grid;
  gap: 16px;
  max-width: 900px;
}

.storybook-manager-playground__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.storybook-manager-playground__controls label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.storybook-manager-playground__controls button,
.storybook-manager-playground__controls select {
  min-height: 30px;
  padding: 4px 9px;
}

.storybook-manager-playground__closed {
  margin: 0;
  color: var(--tr-text-secondary);
}

.storybook-manager-playground__events {
  padding: 12px;
  border: 1px solid var(--tr-border-color-default);
  border-radius: 8px;
}

.storybook-manager-playground__events pre {
  max-height: 180px;
  overflow: auto;
  margin: 8px 0 16px;
  white-space: pre-wrap;
}

.storybook-manager-playground__events ul {
  display: grid;
  gap: 4px;
  margin: 8px 0 0;
  padding-left: 18px;
}
</style>
