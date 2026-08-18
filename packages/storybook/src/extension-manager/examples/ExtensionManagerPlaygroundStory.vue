<script setup lang="ts">
import { IconClose } from '@opentiny/tiny-robot-svgs'
import { computed, onBeforeUnmount, ref } from 'vue'
import type {
  ExtensionCardAction,
  ExtensionCardActionEvent,
  ExtensionManagerActionEvent,
  ExtensionManagerItem,
  ExtensionManagerNameClickEvent,
  ExtensionManagerSectionToggleEvent,
  ExtensionManagerTab,
} from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'

const activeTab = ref('mcp')
const isClosed = ref(false)
const eventHistory = ref<Record<string, unknown>[]>([])
const headerActionCount = ref(0)

type PlaygroundItem = Omit<ExtensionManagerItem, 'actions'> & { enabled?: boolean }
type PlaygroundTab = Omit<ExtensionManagerTab, 'items'> & { items: PlaygroundItem[] }

const getItemActions = (tabId: string, item: PlaygroundItem): ExtensionCardAction[] => {
  if (!item.installed) {
    const installing = item.progress !== undefined

    return [
      {
        id: `add-${item.id}`,
        type: 'button',
        label: installing ? 'Adding...' : 'Add',
        disabled: installing,
      },
    ]
  }

  const commonActions: ExtensionCardAction[] = [
    { id: `inspect-${item.id}`, type: 'button', label: 'Inspect' },
    { id: `remove-${item.id}`, type: 'button', label: 'Remove', danger: true },
  ]

  if (tabId === 'skills') return commonActions

  const enabled = item.enabled ?? true

  return [
    {
      id: `toggle-${item.id}`,
      type: 'switch',
      label: enabled ? `Disable ${item.name}` : `Enable ${item.name}`,
      checked: enabled,
    },
    ...commonActions,
  ]
}

const tabState = ref<PlaygroundTab[]>([
  {
    id: 'mcp',
    label: 'MCP',
    items: [
      {
        id: 'mcp-filesystem',
        name: 'Filesystem MCP',
        description: 'Read and write files from approved local directories.',
        installed: true,
        tags: ['local', 'featured'],
      },
      {
        id: 'mcp-github',
        name: 'GitHub MCP',
        description: 'Inspect repositories, pull requests, issues, and code changes.',
        installed: true,
        tags: ['remote', 'developer'],
      },
      {
        id: 'mcp-postgres',
        name: 'PostgreSQL MCP',
        description: 'Explore schemas and query connected PostgreSQL databases.',
        installed: true,
        tags: ['database', 'developer'],
      },
      {
        id: 'mcp-slack',
        name: 'Slack MCP',
        description: 'Search channels and inspect workspace conversations.',
        tags: ['remote', 'productivity'],
      },
      {
        id: 'mcp-notion',
        name: 'Notion MCP',
        description: 'Browse team pages, databases, and project documentation.',
        tags: ['remote', 'productivity'],
      },
      {
        id: 'mcp-browser',
        name: 'Browser MCP',
        description: 'Give agents controlled browser navigation capabilities.',
        tags: ['featured', 'developer'],
      },
      {
        id: 'mcp-linear',
        name: 'Linear MCP',
        description: 'Search issues, projects, and engineering cycles.',
        tags: ['remote', 'developer'],
      },
    ],
  },
  {
    id: 'skills',
    label: 'Skills',
    items: [
      {
        id: 'skill-code-review',
        name: 'Code Review',
        description: 'Review changes for correctness, maintainability, and regressions.',
        installed: true,
        tags: ['developer', 'featured'],
      },
      {
        id: 'skill-release-notes',
        name: 'Release Notes',
        description: 'Turn merged changes into concise release notes and changelogs.',
        installed: true,
        tags: ['developer', 'writing'],
      },
      {
        id: 'skill-sql-analyst',
        name: 'SQL Analyst',
        description: 'Plan SQL investigations and explain query results.',
        installed: true,
        tags: ['database', 'analysis'],
      },
      {
        id: 'skill-incident-triage',
        name: 'Incident Triage',
        description: 'Structure incident signals, hypotheses, and next actions.',
        tags: ['operations', 'featured'],
      },
      {
        id: 'skill-api-designer',
        name: 'API Designer',
        description: 'Design consistent APIs with clear contracts and trade-offs.',
        tags: ['developer', 'design'],
      },
      {
        id: 'skill-research-assistant',
        name: 'Research Assistant',
        description: 'Organize research questions, evidence, and concise findings.',
        tags: ['analysis', 'writing'],
      },
      {
        id: 'skill-migration-planner',
        name: 'Migration Planner',
        description: 'Break platform migrations into safe, verifiable stages.',
        tags: ['developer', 'operations'],
      },
    ],
  },
  {
    id: 'empty',
    label: 'Empty',
    items: [],
  },
])

const tabs = computed<ExtensionManagerTab[]>(() =>
  tabState.value.map((tab) => ({
    ...tab,
    items: tab.items.map((item) => ({
      ...item,
      actions: getItemActions(tab.id, item),
    })),
  })),
)

const installTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const installIntervals = new Map<string, ReturnType<typeof setInterval>>()

const eventOutput = computed(() => {
  const lastEvent = eventHistory.value[0]

  return lastEvent === undefined
    ? 'Interact with a card, tab, section, or header action.'
    : JSON.stringify(lastEvent, null, 2)
})

const recordEvent = (event: Record<string, unknown>) => {
  eventHistory.value = [event, ...eventHistory.value].slice(0, 5)
}

const serializeAction = (action: ExtensionCardActionEvent) => ({
  id: action.id,
  type: action.type,
  ...(action.checked === undefined ? {} : { checked: action.checked }),
  ...(action.payload === undefined ? {} : { payload: action.payload }),
})

const startInstall = (item: PlaygroundItem) => {
  if (item.installed || item.progress !== undefined) return

  item.progress = 'indeterminate'

  const timeout = setTimeout(() => {
    installTimeouts.delete(item.id)
    item.progress = 0

    const interval = setInterval(() => {
      if (typeof item.progress !== 'number') return

      item.progress = Math.min(100, item.progress + 5)
      if (item.progress < 100) return

      clearInterval(interval)
      installIntervals.delete(item.id)
      item.installed = true
      delete item.progress
    }, 100)

    installIntervals.set(item.id, interval)
  }, 1000)

  installTimeouts.set(item.id, timeout)
}

const handleAction = ({ tabId, sectionKey, itemId, action }: ExtensionManagerActionEvent) => {
  const item = tabState.value.find((tab) => tab.id === tabId)?.items.find((item) => item.id === itemId)

  if (item && action.type === 'switch' && typeof action.checked === 'boolean') {
    item.enabled = action.checked
  }

  if (item && sectionKey === 'available' && action.id === `add-${itemId}`) {
    startInstall(item)
  }

  if (item && sectionKey === 'installed' && action.id === `remove-${itemId}`) {
    delete item.installed
    delete item.enabled
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

onBeforeUnmount(() => {
  installTimeouts.forEach((timeout) => clearTimeout(timeout))
  installIntervals.forEach((interval) => clearInterval(interval))
})
</script>

<template>
  <div class="storybook-manager-playground">
    <div class="storybook-manager-playground__controls">
      <label>
        Active tab
        <select v-model="activeTab" aria-label="Active tab">
          <option value="mcp">MCP</option>
          <option value="skills">Skills</option>
          <option value="empty">Empty (no tags)</option>
        </select>
      </label>
    </div>

    <p v-if="isClosed" class="storybook-manager-playground__closed">
      Manager closed.
      <span style="text-decoration: underline; cursor: pointer" @click="isClosed = false">Click me</span>
      to open it.
    </p>

    <div v-else class="storybook-manager-playground__surface">
      <ExtensionManager
        v-model:active-tab="activeTab"
        :tabs="tabs"
        title="服务列表"
        @tab-change="handleTabChange"
        @section-toggle="handleSectionToggle"
        @action="handleAction"
        @name-click="handleNameClick"
      >
        <template #header-actions>
          <button type="button" @click="handleHeaderAction">Header action</button>
          <button class="storybook-manager-playground__close" type="button" aria-label="Close" @click="handleClose">
            <IconClose />
          </button>
        </template>

        <template #empty="{ title }">
          <span>{{ title }} is empty.</span>
        </template>
      </ExtensionManager>
    </div>

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

.storybook-manager-playground__surface {
  max-width: 820px;
  padding: 24px;
  background: var(--tr-container-bg-default);
  border: 1px solid var(--tr-mcp-server-picker-border-color-default);
  border-radius: 12px;
}

.storybook-manager-playground__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 5px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.storybook-manager-playground__close:hover {
  background: var(--tr-mcp-server-picker-bg-hover);
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
