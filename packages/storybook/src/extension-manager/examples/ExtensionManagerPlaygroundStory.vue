<script setup lang="ts">
import type {
  ExtensionCardAction,
  ExtensionCardActionEvent,
  ExtensionManagerActionEvent,
  ExtensionManagerItem,
  ExtensionManagerNameClickEvent,
  ExtensionManagerRetryEvent,
  ExtensionManagerSectionToggleEvent,
  ExtensionManagerTab,
} from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { IconEditPen, IconSparkles } from '@opentiny/tiny-robot-svgs'
import { computed, markRaw, ref } from 'vue'

type SectionState = 'items' | 'loading' | 'error' | 'empty'

const sparklesIcon = markRaw(IconSparkles)
const editIcon = markRaw(IconEditPen)

const activeTab = ref('workspace')
const expandedSections = ref<Record<string, boolean>>({
  'workspace-enabled': true,
  'workspace-state': true,
  'catalog-recommended': true,
  'catalog-empty': false,
})
const sectionState = ref<SectionState>('items')
const switchEnabled = ref(true)
const isClosed = ref(false)
const headerActionCount = ref(0)
const retryCount = ref(0)
const lastEvent = ref<Record<string, unknown>>()
const eventHistory = ref<Record<string, unknown>[]>([])

const stateOptions: Array<{ value: SectionState; label: string }> = [
  { value: 'items', label: 'Items' },
  { value: 'loading', label: 'Loading' },
  { value: 'error', label: 'Error' },
  { value: 'empty', label: 'Empty' },
]

const stateItems = computed<ExtensionManagerItem[]>(() =>
  sectionState.value === 'empty'
    ? []
    : [
        {
          id: 'state-item',
          name: 'Local state item',
          description: 'The state controls change this section without leaving the story.',
          nameClickable: true,
        },
      ],
)

const alphaActions = computed<ExtensionCardAction[]>(() => [
  {
    id: 'toggle-alpha',
    type: 'switch',
    label: switchEnabled.value ? 'Disable Alpha' : 'Enable Alpha',
    checked: switchEnabled.value,
    icon: sparklesIcon,
  },
  { id: 'inspect-alpha', type: 'button', label: 'Inspect Alpha', icon: editIcon },
])

const tabs = computed<ExtensionManagerTab[]>(() => [
  {
    id: 'workspace',
    label: 'Workspace',
    badge: 2,
    sections: [
      {
        id: 'workspace-enabled',
        title: 'Enabled extensions',
        items: [
          {
            id: 'alpha',
            name: 'Alpha extension',
            description: 'An action-enabled item rendered through the real CardGrid path.',
            icon: sparklesIcon,
            actions: alphaActions.value,
            primaryActionsLimit: 2,
            nameClickable: true,
          },
        ],
        columns: 1,
        collapsible: true,
        defaultExpanded: true,
      },
      {
        id: 'workspace-state',
        title: 'State playground',
        items: stateItems.value,
        collapsible: true,
        defaultExpanded: true,
        loading: sectionState.value === 'loading',
        error: sectionState.value === 'error' ? 'The local fixture could not load this section.' : undefined,
        emptyText: 'There are no local items in this state.',
      },
    ],
  },
  {
    id: 'catalog',
    label: 'Catalog',
    badge: 1,
    sections: [
      {
        id: 'catalog-recommended',
        title: 'Recommended extensions',
        items: [
          {
            id: 'beta',
            name: 'Beta extension',
            description: 'Switch tabs to inspect another section and another contextual item event.',
            icon: editIcon,
            actions: [{ id: 'inspect-beta', type: 'button', label: 'Inspect Beta', icon: editIcon }],
            nameClickable: true,
          },
        ],
        columns: 1,
        collapsible: true,
        defaultExpanded: true,
      },
      {
        id: 'catalog-empty',
        title: 'Empty catalog section',
        items: [],
        collapsible: true,
        defaultExpanded: false,
        emptyText: 'Nothing has been added to this section yet.',
      },
    ],
  },
])

const itemSlotPreviewTabs: ExtensionManagerTab[] = [
  {
    id: 'slot-preview',
    label: 'Preview',
    sections: [
      {
        id: 'custom-item',
        title: 'Custom item content',
        items: [
          {
            id: 'slot-item',
            name: 'Custom item preview',
            description: 'This compact Manager renders its item through the item slot.',
          },
        ],
        columns: 1,
        collapsible: false,
      },
    ],
  },
]

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

const handleAction = (tabId: string, sectionId: string, itemId: string, action: ExtensionCardActionEvent) => {
  if (itemId === 'alpha' && action.id === 'toggle-alpha' && typeof action.checked === 'boolean') {
    switchEnabled.value = action.checked
  }

  recordEvent({
    type: 'action',
    tabId,
    sectionId,
    itemId,
    action: serializeAction(action),
  })
}

const handleManagerAction = ({ tabId, sectionId, itemId, action }: ExtensionManagerActionEvent) => {
  handleAction(tabId, sectionId, itemId, action)
}

const handleNameClick = (tabId: string, sectionId: string, itemId: string, event: MouseEvent | KeyboardEvent) => {
  recordEvent({
    type: 'name-click',
    tabId,
    sectionId,
    itemId,
    event: { type: event.type },
  })
}

const handleManagerNameClick = ({ tabId, sectionId, itemId, event }: ExtensionManagerNameClickEvent) => {
  handleNameClick(tabId, sectionId, itemId, event)
}

const handleTabChange = ({ tabId }: { tabId: string }) => {
  recordEvent({ type: 'tab-change', tabId })
}

const handleSectionToggle = ({ tabId, sectionId, expanded }: ExtensionManagerSectionToggleEvent) => {
  recordEvent({ type: 'section-toggle', tabId, sectionId, expanded })
}

const handleRetry = ({ tabId, sectionId }: ExtensionManagerRetryEvent) => {
  retryCount.value += 1
  sectionState.value = 'items'
  recordEvent({ type: 'retry', tabId, sectionId, attempt: retryCount.value })
}

const retryStateSection = () => {
  retryCount.value += 1
  sectionState.value = 'items'
  recordEvent({ type: 'retry', tabId: 'workspace', sectionId: 'workspace-state', attempt: retryCount.value })
}

const handleHeaderAction = (action: string) => {
  headerActionCount.value += 1
  recordEvent({ type: 'header-action', action, count: headerActionCount.value })
}

const handleClose = () => {
  isClosed.value = true
  recordEvent({ type: 'close' })
}

const toggleSection = (sectionId: string) => {
  expandedSections.value = {
    ...expandedSections.value,
    [sectionId]: !(expandedSections.value[sectionId] ?? true),
  }
}

const setAllSectionsExpanded = (expanded: boolean) => {
  expandedSections.value = Object.fromEntries(
    tabs.value.flatMap((tab) => tab.sections.map((section) => [section.id, expanded])),
  )
}
</script>

<template>
  <div class="storybook-manager-playground">
    <div class="storybook-manager-playground__controls">
      <div class="storybook-manager-playground__control-group">
        <strong>Local controls</strong>
        <label>
          Active tab
          <select v-model="activeTab" aria-label="Active tab">
            <option v-for="tab in tabs" :key="tab.id" :value="tab.id">{{ tab.label }}</option>
          </select>
        </label>
        <label>
          State section
          <select v-model="sectionState" aria-label="State section">
            <option v-for="option in stateOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
      </div>

      <div class="storybook-manager-playground__control-group">
        <strong>Section collapse</strong>
        <button type="button" @click="toggleSection('workspace-enabled')">
          {{ expandedSections['workspace-enabled'] ? 'Collapse' : 'Expand' }} enabled section
        </button>
        <button type="button" @click="setAllSectionsExpanded(true)">Expand all sections</button>
        <button type="button" @click="setAllSectionsExpanded(false)">Collapse all sections</button>
      </div>

      <div class="storybook-manager-playground__control-group">
        <strong>State and lifecycle</strong>
        <button type="button" :disabled="sectionState !== 'error'" @click="retryStateSection">
          Retry state section
        </button>
        <button type="button" :disabled="!isClosed" @click="isClosed = false">Reopen Manager</button>
        <span class="storybook-manager-playground__status">
          {{ headerActionCount }} header actions · {{ retryCount }} retries
        </span>
      </div>
    </div>

    <ExtensionManager
      v-if="!isClosed"
      :tabs="tabs"
      v-model:active-tab="activeTab"
      v-model:expanded-sections="expandedSections"
      title="Extension manager playground"
      show-close-button
      empty-text="No enabled tabs"
      @tab-change="handleTabChange"
      @section-toggle="handleSectionToggle"
      @action="handleManagerAction"
      @name-click="handleManagerNameClick"
      @retry="handleRetry"
      @close="handleClose"
    >
      <template #header-actions>
        <button type="button" @click="handleHeaderAction('create')">Create extension</button>
        <button type="button" @click="handleHeaderAction('refresh')">Refresh local data</button>
      </template>

      <template #tab="{ tab, active, select }">
        <span class="storybook-manager-playground__tab-label" @click.stop="select">
          {{ tab.label }}
          <span v-if="active" class="storybook-manager-playground__tab-state">active</span>
        </span>
      </template>

      <template #section-header="{ tab, section, expanded, toggle }">
        <button
          type="button"
          class="storybook-manager-playground__section-header"
          :aria-expanded="expanded"
          @click="toggle"
        >
          <span>{{ section.title }}</span>
          <small>{{ tab.label }} · {{ section.items.length }} items</small>
        </button>
      </template>

      <template #loading="{ tab, section }">
        <div class="storybook-manager-playground__state">Loading {{ tab.label }} / {{ section.title }} locally…</div>
      </template>

      <template #error="{ tab, section, error, retry }">
        <div class="storybook-manager-playground__state storybook-manager-playground__state--error">
          <span>{{ tab.label }} / {{ section.title }}: {{ String(error) }}</span>
          <button type="button" @click.stop="retry">Retry section</button>
        </div>
      </template>

      <template #empty="{ tab, section }">
        <div class="storybook-manager-playground__state">{{ tab.label }} / {{ section.title }} is empty.</div>
      </template>
    </ExtensionManager>

    <div v-else class="storybook-manager-playground__closed">
      <strong>Manager closed.</strong>
      <span>Use the lifecycle control to reopen the local playground.</span>
      <button type="button" @click="isClosed = false">Reopen Manager</button>
    </div>

    <section class="storybook-manager-playground__item-slot-preview">
      <div class="storybook-manager-playground__item-slot-intro">
        <strong>Custom item slot preview</strong>
        <span>The main Manager above uses default Cards for contextual event routing.</span>
      </div>

      <ExtensionManager :tabs="itemSlotPreviewTabs" title="Item slot content">
        <template #item="{ tab, section, item, index }">
          <article class="storybook-manager-playground__custom-item">
            <strong>{{ item.name }}</strong>
            <span>{{ item.description }}</span>
            <code>{{ tab.id }}/{{ section.id }}/{{ item.id }} · index {{ index }}</code>
          </article>
        </template>
      </ExtensionManager>
    </section>

    <section class="storybook-manager-playground__events" aria-live="polite">
      <div>
        <strong>Latest contextual event</strong>
        <pre>{{ eventOutput }}</pre>
      </div>
      <div>
        <strong>Recent event history</strong>
        <ol v-if="eventHistory.length > 0">
          <li v-for="(event, index) in eventHistory" :key="`${String(event.type)}-${index}`">
            {{ JSON.stringify(event) }}
          </li>
        </ol>
        <p v-else>No events yet.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.storybook-manager-playground {
  display: grid;
  gap: 16px;
  width: min(920px, 94vw);
}

.storybook-manager-playground__controls {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 14px;
  border: 1px solid #d9e7fb;
  border-radius: 10px;
  background: #fff;
  color: #52607a;
  font-size: 12px;
}

.storybook-manager-playground__control-group {
  display: grid;
  align-content: start;
  gap: 8px;
}

.storybook-manager-playground__control-group label {
  display: grid;
  gap: 5px;
}

.storybook-manager-playground__control-group select,
.storybook-manager-playground__control-group button,
.storybook-manager-playground__header-action,
.storybook-manager-playground__state button,
.storybook-manager-playground__closed button {
  box-sizing: border-box;
  min-height: 30px;
  padding: 4px 8px;
  border: 1px solid #cbd8ed;
  border-radius: 6px;
  background: #fff;
  color: #243f75;
  font: inherit;
}

.storybook-manager-playground__control-group button,
.storybook-manager-playground__state button,
.storybook-manager-playground__closed button {
  cursor: pointer;
}

.storybook-manager-playground__control-group button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.storybook-manager-playground__status {
  color: #7082a1;
}

.storybook-manager-playground__tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.storybook-manager-playground__tab-state {
  color: #7082a1;
  font-size: 11px;
  font-weight: 400;
}

.storybook-manager-playground__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 32px;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: #243f75;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.storybook-manager-playground__section-header small {
  color: #7082a1;
  font-size: 11px;
  font-weight: 400;
}

.storybook-manager-playground__item-slot-preview {
  display: grid;
  gap: 8px;
  width: min(560px, 100%);
}

.storybook-manager-playground__item-slot-intro {
  display: grid;
  gap: 4px;
  color: #52607a;
  font-size: 12px;
}

.storybook-manager-playground__custom-item {
  display: grid;
  gap: 6px;
  min-height: 84px;
  padding: 12px;
  border: 1px dashed #9eb4d6;
  border-radius: 8px;
  background: #fff;
  color: #52607a;
  font-size: 12px;
}

.storybook-manager-playground__custom-item strong {
  color: #243f75;
  font-size: 14px;
}

.storybook-manager-playground__custom-item code {
  overflow: hidden;
  color: #7082a1;
  font:
    11px/1.4 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.storybook-manager-playground__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px 0;
  color: #52607a;
  font-size: 13px;
  text-align: center;
}

.storybook-manager-playground__state--error {
  flex-wrap: wrap;
}

.storybook-manager-playground__closed {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 36px 20px;
  border: 1px dashed #cbd8ed;
  border-radius: 12px;
  background: #fff;
  color: #52607a;
  text-align: center;
}

.storybook-manager-playground__events {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  color: #52607a;
  font-size: 12px;
}

.storybook-manager-playground__events > div {
  min-width: 0;
  padding: 12px;
  border: 1px solid #d9e7fb;
  border-radius: 8px;
  background: #fff;
}

.storybook-manager-playground__events pre,
.storybook-manager-playground__events ol,
.storybook-manager-playground__events p {
  margin: 8px 0 0;
}

.storybook-manager-playground__events pre,
.storybook-manager-playground__events li {
  overflow-wrap: anywhere;
  font:
    11px/1.5 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
}

.storybook-manager-playground__events pre {
  min-height: 84px;
  padding: 8px;
  border-radius: 6px;
  background: #f1f5ff;
  white-space: pre-wrap;
}

.storybook-manager-playground__events ol {
  display: grid;
  gap: 5px;
  padding-left: 20px;
}

@media (max-width: 760px) {
  .storybook-manager-playground__controls,
  .storybook-manager-playground__events {
    grid-template-columns: 1fr;
  }
}
</style>
